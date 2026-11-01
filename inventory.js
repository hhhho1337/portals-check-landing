(() => {
  'use strict';

  const INVENTORY = Object.freeze({
    endpoint: '/portals/api/gifts',
    liquidThreshold: 75,
    requestTimeoutMs: 8000,
  });

  const messages = {
    ru: {
      loadingInventory: 'Загружаем подарки…',
      openFromBot: 'Откройте Web App из бота, чтобы загрузить коллекцию.',
      loadError: 'Не удалось загрузить коллекцию. Попробуйте ещё раз.',
      retry: 'Повторить',
      loadingImage: 'Загружаем WebP…',
      imageError: 'Превью недоступно',
      liquidity: 'Ликвидность',
      count: 'Подарков в коллекции',
      average: 'Средняя ликвидность',
      caption: 'Коллекция загружена из Telegram-бота. Значения ликвидности получены с сервера.',
    },
    en: {
      loadingInventory: 'Loading gifts…',
      openFromBot: 'Open the Web App from the bot to load your collection.',
      loadError: 'Could not load the collection. Please try again.',
      retry: 'Retry',
      loadingImage: 'Loading WebP…',
      imageError: 'Preview unavailable',
      liquidity: 'Liquidity',
      count: 'Gifts in collection',
      average: 'Average liquidity',
      caption: 'The collection is loaded from the Telegram bot. Liquidity values come from the server.',
    },
  };

  const start = () => {
    const core = window.GiftCore;
    const grid = document.querySelector('#gift-grid');
    const status = document.querySelector('#inventory-status');
    const list = document.querySelector('#liquidity-list');
    const summary = document.querySelector('#portfolio-summary');
    const empty = document.querySelector('#gift-empty');
    const noResults = document.querySelector('#gift-no-results');
    const liquidityEmpty = document.querySelector('#liquidity-empty');
    const portfolioEmpty = document.querySelector('#portfolio-empty');
    if (!core || !grid || !status || !list || !summary || !empty
      || !noResults || !liquidityEmpty || !portfolioEmpty) return;

    let language = document.documentElement.lang === 'en' ? 'en' : 'ru';
    let gifts = [];
    let statusMode = 'none';
    let retryTarget = '';
    let requestController;
    let requestVersion = 0;

    const t = key => messages[language][key];
    const node = (tag, className, text) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };

    const renderStatus = () => {
      status.replaceChildren();
      const messageKey = statusMode === 'loading' ? 'loadingInventory'
        : statusMode === 'unavailable' ? 'openFromBot'
          : statusMode === 'error' ? 'loadError' : '';
      if (!messageKey) return;
      status.append(node('span', 'inventory-status-message', t(messageKey)));
      if (statusMode !== 'error') return;
      const retry = node('button', 'inventory-retry-button', t('retry'));
      retry.type = 'button';
      retry.addEventListener('click', () => {
        if (retryTarget === 'session') {
          document.dispatchEvent(new CustomEvent('portals:retry-session'));
          statusMode = 'loading';
          renderStatus();
        } else loadInventory();
      });
      status.append(retry);
    };

    const setStatus = (mode, target = '') => {
      statusMode = mode;
      retryTarget = target;
      renderStatus();
    };

    const renderCard = gift => {
      const card = node('article', 'gift-card');
      card.dataset.gift = gift.id;
      card.dataset.name = `${gift.name} ${gift.slug} ${gift.number}`;
      card.dataset.category = gift.liquidity >= INVENTORY.liquidThreshold ? 'liquid' : 'all';

      const media = node('div', 'gift-media');
      const image = node('img', 'gift-image');
      image.alt = gift.title;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      const imageStatus = node('div', 'gift-image-status', t('loadingImage'));
      const retry = node('button', 'gift-retry', t('retry'));
      retry.type = 'button';
      retry.hidden = true;
      const loadPreview = () => {
        image.hidden = false;
        imageStatus.hidden = false;
        imageStatus.textContent = t('loadingImage');
        retry.hidden = true;
        image.removeAttribute('src');
        image.src = gift.imageUrl;
      };
      image.addEventListener('load', () => {
        image.hidden = false;
        imageStatus.hidden = true;
        retry.hidden = true;
      });
      image.addEventListener('error', () => {
        image.hidden = true;
        imageStatus.hidden = false;
        imageStatus.textContent = t('imageError');
        retry.hidden = false;
      });
      retry.addEventListener('click', loadPreview);
      media.append(image, imageStatus, retry);
      loadPreview();

      const info = node('div', 'gift-info');
      const title = node('h3', 'gift-name', gift.name);
      const number = node('p', 'gift-number', `#${gift.number}`);
      const score = node('div', 'gift-liquidity');
      score.append(node('span', 'liquidity-label', t('liquidity')),
        node('strong', 'liquidity-value', `${gift.liquidity}%`));
      const track = node('div', 'liquidity-track');
      track.setAttribute('aria-hidden', 'true');
      const fill = node('span', 'liquidity-fill');
      fill.style.width = `${gift.liquidity}%`;
      track.append(fill);
      info.append(title, number, score, track);
      card.append(media, info);
      return card;
    };

    const render = () => {
      const hasGifts = gifts.length > 0;
      grid.replaceChildren(...gifts.map(renderCard));
      grid.hidden = !hasGifts;
      empty.hidden = hasGifts;
      document.querySelector('#inventory-count').textContent = String(gifts.length);
      document.querySelector('#inventory-balance').textContent = String(gifts.length);

      list.replaceChildren(...gifts.map(gift => {
        const row = node('div', 'liquidity-row');
        const info = node('div', 'liquidity-row-info');
        info.append(node('h3', 'gift-name', gift.name), node('span', 'gift-number', `#${gift.number}`));
        const score = node('div', 'liquidity-row-score');
        score.append(node('span', 'liquidity-label', t('liquidity')),
          node('strong', 'liquidity-value', `${gift.liquidity}%`));
        row.append(info, score);
        return row;
      }));
      list.hidden = !hasGifts;
      liquidityEmpty.hidden = hasGifts;

      summary.replaceChildren();
      if (hasGifts) {
        const stats = node('div', 'portfolio-stats');
        const average = gifts.reduce((sum, gift) => sum + gift.liquidity, 0) / gifts.length;
        [[String(gifts.length), t('count')], [`${average.toFixed(1)}%`, t('average')]].forEach(([value, label]) => {
          const stat = node('div', 'portfolio-stat');
          stat.append(node('strong', 'portfolio-value', value), node('span', 'portfolio-label', label));
          stats.append(stat);
        });
        summary.append(stats, node('p', 'portfolio-caption', t('caption')));
      }
      summary.hidden = !hasGifts;
      portfolioEmpty.hidden = hasGifts;
      document.dispatchEvent(new Event('inventory:changed'));
    };

    const clearInventory = (mode, target = '') => {
      requestVersion += 1;
      requestController?.abort();
      gifts = [];
      setStatus(mode, target);
      render();
    };

    const loadInventory = async () => {
      const version = ++requestVersion;
      requestController?.abort();
      const controller = new AbortController();
      requestController = controller;
      const requestTimeout = window.setTimeout(() => controller.abort(), INVENTORY.requestTimeoutMs);
      setStatus('loading');
      try {
        const response = await fetch(INVENTORY.endpoint, {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (version !== requestVersion) return;
        if (response.status === 401) {
          clearInventory('unavailable');
          return;
        }
        if (!response.ok) throw new Error('INVENTORY_REQUEST_FAILED');
        const payload = await response.json();
        if (!payload || payload.ok !== true || !Array.isArray(payload.gifts)) {
          throw new Error('INVALID_INVENTORY_RESPONSE');
        }
        gifts = core.normalizeServerRecords(payload.gifts);
        setStatus('none');
        render();
      } catch (error) {
        if (version !== requestVersion) return;
        if (error && error.name === 'AbortError') {
          setStatus('error', 'inventory');
          return;
        }
        setStatus('error', 'inventory');
      } finally {
        window.clearTimeout(requestTimeout);
      }
    };

    document.addEventListener('inventory:filtered', event => {
      noResults.hidden = gifts.length === 0 || event.detail.visible > 0;
    });
    document.addEventListener('ui:language', event => {
      language = event.detail.language;
      renderStatus();
      render();
    });
    document.addEventListener('portals:session-state', event => {
      if (event.detail.status === 'ready') loadInventory();
      else if (event.detail.status === 'unavailable') clearInventory('unavailable');
      else if (event.detail.status === 'error') clearInventory('error', 'session');
    });

    render();
    const sessionStatus = window.PortalsSessionStatus;
    if (sessionStatus === 'ready') loadInventory();
    else if (sessionStatus === 'unavailable') clearInventory('unavailable');
    else if (sessionStatus === 'error') clearInventory('error', 'session');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
