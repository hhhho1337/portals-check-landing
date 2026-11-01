(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.GiftCore = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';

  const CONFIG = Object.freeze({
    maxUrlLength: 2048,
    maxRecords: 500,
    maxNameLength: 160,
    minNumber: 1,
    zero: 0,
    one: 1,
    giftOrigin: 'https://fragment.com/gift/',
    imageOrigin: 'https://nft.fragment.com/gift/',
    previewOrigin: '/portals/gift-preview/',
    imageExtension: '.webp',
    authority: /^https:\/\/(fragment\.com|nft\.fragment\.com|t\.me)(\/[^?#]*)$/i,
    slugPattern: /^([a-z][a-z0-9]*)-([1-9][0-9]*)$/i,
    pagePattern: /^\/gift\/([a-z][a-z0-9]*-[1-9][0-9]*)\/?$/i,
    imagePattern: /^\/gift\/([a-z][a-z0-9]*-[1-9][0-9]*)\.webp$/i,
    telegramPattern: /^\/nft\/([a-z][a-z0-9]*-[1-9][0-9]*)\/?$/i,
  });

  const invalid = () => new Error('INVALID_GIFT_URL');

  const splitSlug = (input) => {
    if (typeof input !== 'string' || input.length > CONFIG.maxNameLength) throw invalid();
    const match = CONFIG.slugPattern.exec(input);
    if (!match) throw invalid();
    const number = Number(match[2]);
    if (!Number.isSafeInteger(number) || number < CONFIG.minNumber) throw invalid();
    const token = match[1];
    return { token, number, slug: `${token.toLowerCase()}-${number}` };
  };

  const displayName = (token) => {
    const spaced = token
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    return spaced.charAt(CONFIG.zero).toUpperCase() + spaced.slice(CONFIG.one);
  };

  const parseGiftUrl = (input) => {
    if (typeof input !== 'string' || input.length > CONFIG.maxUrlLength) throw invalid();
    const value = input.trim();
    if (!value || /[\s\\]/.test(value)) throw invalid();
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
    const authority = CONFIG.authority.exec(absolute);
    if (!authority) throw invalid();
    const host = authority[1].toLowerCase();
    const pathname = authority[2];
    const pattern = host === 'nft.fragment.com' ? CONFIG.imagePattern
      : host === 't.me' ? CONFIG.telegramPattern : CONFIG.pagePattern;
    const match = pattern.exec(pathname);
    if (!match) throw invalid();
    const { token, number, slug } = splitSlug(match[1]);
    const name = displayName(token);
    return {
      id: slug,
      slug,
      name,
      number,
      title: `${name} #${number}`,
      url: `${CONFIG.giftOrigin}${slug}`,
      imageUrl: `${CONFIG.imageOrigin}${slug}${CONFIG.imageExtension}`,
    };
  };

  const safeText = (value, maximum) => {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    if (!text || text.length > maximum || /[\u0000-\u001f\u007f]/.test(text)) return '';
    return text;
  };

  const normalizeServerRecords = (rows) => {
    if (!Array.isArray(rows)) return [];
    const records = [];
    const seen = new Set();
    for (const row of rows.slice(CONFIG.zero, CONFIG.maxRecords)) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      try {
        const record = parseGiftUrl(row.url);
        const id = safeText(row.id, CONFIG.maxNameLength);
        const slug = safeText(row.slug, CONFIG.maxNameLength).toLowerCase();
        const name = safeText(row.name, CONFIG.maxNameLength);
        const title = safeText(row.title, CONFIG.maxNameLength);
        if (!id || id.toLowerCase() !== record.slug || slug !== record.slug) continue;
        if (row.url !== record.url || row.imageUrl !== record.imageUrl) continue;
        if (row.number !== record.number || !Number.isInteger(row.liquidity)
          || row.liquidity < CONFIG.zero || row.liquidity > 100) continue;
        if (!name || !title || title !== `${name} #${record.number}`) continue;
        if (!Number.isSafeInteger(row.addedAt) || row.addedAt < CONFIG.zero) continue;
        if (seen.has(record.slug)) continue;
        record.name = name;
        record.title = title;
        record.liquidity = row.liquidity;
        record.addedAt = row.addedAt;
        record.imageUrl = `${CONFIG.previewOrigin}${record.slug}${CONFIG.imageExtension}`;
        seen.add(record.slug);
        records.push(record);
      } catch {
        // Некорректная серверная запись пропускается, не ломая коллекцию.
      }
    }
    return records;
  };

  return Object.freeze({ parseGiftUrl, normalizeServerRecords });
});
