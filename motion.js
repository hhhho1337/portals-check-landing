(() => {
  'use strict';

  const MOTION = Object.freeze({
    fadeMs: 200,
    revealStepMs: 85,
    panelMs: 300,
    panelOffsetPx: 10,
    intersectionThreshold: 0.08,
    glowDefaultX: '75%',
    glowDefaultY: '35%',
    easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  });

  const root = document.documentElement;
  const shell = document.querySelector('.app-shell');
  const loaderElement = document.querySelector('#loader');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const revealNodes = [...document.querySelectorAll('.topbar, .page-intro > div:first-child, .intro-art, .workspace, footer')];
  let ready = false;
  let revealTimer;
  let revealObserver;

  revealNodes.forEach((node, index) => {
    node.classList.add('motion-pending');
    node.style.setProperty('--reveal-delay', `${index * MOTION.revealStepMs}ms`);
  });

  const revealAll = () => revealNodes.forEach(node => node.classList.add('motion-visible'));
  const revealPage = () => {
    ready = true;
    shell.inert = false;
    root.classList.remove('motion-loading');
    loaderElement?.setAttribute('aria-hidden', 'true');
    if (loaderElement) loaderElement.inert = true;
    if (reduced.matches || !('IntersectionObserver' in window)) {
      revealAll();
      return;
    }
    revealObserver?.disconnect();
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add('motion-visible');
        revealObserver.unobserve(target);
      });
    }, { threshold: MOTION.intersectionThreshold });
    revealNodes.forEach(node => revealObserver.observe(node));
  };

  const syncLoader = () => {
    window.clearTimeout(revealTimer);
    if (!loaderElement || loaderElement.classList.contains('is-hidden')) {
      if (reduced.matches) revealPage();
      else revealTimer = window.setTimeout(revealPage, MOTION.fadeMs);
      return;
    }
    ready = false;
    shell.inert = true;
    loaderElement.inert = false;
    loaderElement.removeAttribute('aria-hidden');
    root.classList.add('motion-loading');
  };
  if (!shell) return;
  if (loaderElement) new MutationObserver(syncLoader).observe(loaderElement, { attributes: true, attributeFilter: ['class'] });
  syncLoader();

  const tabBar = document.querySelector('.tabs');
  let previousTab = null;
  let panelAnimation;
  let indicatorFrame;
  const moveIndicator = () => {
    const active = tabBar?.querySelector('[data-tab].active');
    if (!active) return;
    tabBar.style.setProperty('--indicator-x', `${active.offsetLeft}px`);
    tabBar.style.setProperty('--indicator-width', `${active.offsetWidth}px`);
    if (previousTab && previousTab !== active && ready && !reduced.matches) {
      const panel = [...document.querySelectorAll('[data-panel]')].find(node => node.dataset.panel === active.dataset.tab);
      panelAnimation?.cancel();
      if (panel && typeof panel.animate === 'function') {
        panelAnimation = panel.animate([
          { opacity: 0, transform: `translateY(${MOTION.panelOffsetPx}px)` },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: MOTION.panelMs, easing: MOTION.easing });
      }
    }
    previousTab = active;
  };
  const scheduleIndicator = () => {
    cancelAnimationFrame(indicatorFrame);
    indicatorFrame = requestAnimationFrame(moveIndicator);
  };
  if (tabBar) {
    const indicator = document.createElement('span');
    indicator.className = 'tab-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    tabBar.append(indicator);
    tabBar.classList.add('has-tab-indicator');
    new MutationObserver(scheduleIndicator).observe(tabBar, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(scheduleIndicator);
      resizeObserver.observe(tabBar);
      tabBar.querySelectorAll('[data-tab]').forEach(tab => resizeObserver.observe(tab));
    }
    window.addEventListener('resize', scheduleIndicator, { passive: true });
    scheduleIndicator();
  }

  const welcome = document.querySelector('.welcome-card');
  let pointerFrame;
  const resetGlow = () => {
    cancelAnimationFrame(pointerFrame);
    welcome?.style.setProperty('--glow-x', MOTION.glowDefaultX);
    welcome?.style.setProperty('--glow-y', MOTION.glowDefaultY);
  };
  welcome?.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduced.matches || event.pointerType === 'touch') return;
    cancelAnimationFrame(pointerFrame);
    const { clientX, clientY } = event;
    pointerFrame = requestAnimationFrame(() => {
      const rect = welcome.getBoundingClientRect();
      welcome.style.setProperty('--glow-x', `${clientX - rect.left}px`);
      welcome.style.setProperty('--glow-y', `${clientY - rect.top}px`);
    });
  }, { passive: true });
  welcome?.addEventListener('pointerleave', resetGlow);

  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    panelAnimation?.cancel();
    resetGlow();
    revealObserver?.disconnect();
    if (ready) revealAll();
    else syncLoader();
  });
  const syncVisibility = () => root.classList.toggle('motion-paused', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
})();
