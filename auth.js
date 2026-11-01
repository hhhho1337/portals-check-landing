(() => {
  'use strict';

  const startedAt = performance.now();
  const minimumVisibleMs = 900;
  let finished = false;
  let booted = false;
  let requesting = false;

  const finishLoading = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(safeTimeout);
    const wait = Math.max(0, minimumVisibleMs - (performance.now() - startedAt));
    window.setTimeout(() => window.loader?.finish(), wait);
  };

  const setSessionState = (status) => {
    window.PortalsSessionStatus = status;
    document.dispatchEvent(new CustomEvent('portals:session-state', { detail: { status } }));
  };

  const safeTimeout = window.setTimeout(finishLoading, 10000);

  const authenticate = async () => {
    if (requesting) return;
    const telegramWebApp = window.Telegram && window.Telegram.WebApp;
    let initData = telegramWebApp && typeof telegramWebApp.initData === 'string'
      ? telegramWebApp.initData : '';
    if (!telegramWebApp || !initData) {
      setSessionState('unavailable');
      finishLoading();
      return;
    }

    requesting = true;
    window.loader?.setProgress(82);
    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('/portals/api/session', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ init_data: initData }),
        signal: controller.signal,
      });
      if (response.ok) setSessionState('ready');
      else if (response.status === 401 || response.status === 403) setSessionState('unavailable');
      else setSessionState('error');
    } catch {
      setSessionState('error');
    } finally {
      initData = '';
      requesting = false;
      window.clearTimeout(requestTimeout);
      finishLoading();
    }
  };

  const bootTelegram = () => {
    if (booted) return;
    const telegramWebApp = window.Telegram && window.Telegram.WebApp;
    if (!telegramWebApp) return;
    booted = true;
    try { telegramWebApp.ready(); } catch (_) {}
    try { telegramWebApp.expand(); } catch (_) {}
    authenticate();
  };

  document.addEventListener('portals:retry-session', authenticate);

  const telegramScript = document.querySelector('#telegram-web-app');
  if (window.Telegram && window.Telegram.WebApp) bootTelegram();
  else if (telegramScript) {
    telegramScript.addEventListener('load', bootTelegram, { once: true });
    telegramScript.addEventListener('error', () => {
      setSessionState('unavailable');
      finishLoading();
    }, { once: true });
    window.setTimeout(() => {
      if (!booted) {
        setSessionState('unavailable');
        finishLoading();
      }
    }, 3000);
  } else {
    setSessionState('unavailable');
    finishLoading();
  }
})();
