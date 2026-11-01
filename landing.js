(() => {
  'use strict';

  const start = () => {
    const tabs = [...document.querySelectorAll('[data-tab]')];
    const panels = [...document.querySelectorAll('[data-panel]')];
    const activateTab = (name) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.tab === name;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(tab.dataset.tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        tabs[next].focus();
        activateTab(tabs[next].dataset.tab);
      });
    });
    if (tabs.length) activateTab(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.tab || tabs[0].dataset.tab);

    const search = document.querySelector('#gift-search');
    const filterButton = document.querySelector('#filter-toggle');
    const filterPanel = document.querySelector('#filter-panel');
    let filter = 'all';
    const applyFilters = () => {
      const query = (search?.value || '').trim().toLocaleLowerCase();
      document.querySelectorAll('[data-gift]').forEach((gift) => {
        const name = (gift.dataset.name || gift.textContent).toLocaleLowerCase();
        const category = gift.dataset.category || 'all';
        gift.hidden = !name.includes(query) || (filter !== 'all' && category !== filter);
      });
      document.dispatchEvent(new CustomEvent('inventory:filtered', {
        detail: { visible: document.querySelectorAll('[data-gift]:not([hidden])').length },
      }));
    };
    search?.addEventListener('input', applyFilters);
    document.addEventListener('inventory:changed', applyFilters);
    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && search) {
        event.preventDefault();
        activateTab('gifts');
        search.focus();
      }
    });
    const closeFilters = () => {
      if (!filterPanel) return;
      filterPanel.hidden = true;
      filterButton?.setAttribute('aria-expanded', 'false');
    };
    filterButton?.addEventListener('click', () => {
      if (!filterPanel) return;
      filterPanel.hidden = !filterPanel.hidden;
      filterButton.setAttribute('aria-expanded', String(!filterPanel.hidden));
    });
    document.querySelectorAll('[data-filter]').forEach((option) => {
      option.addEventListener('click', () => {
        filter = option.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach((item) => {
          const selected = item === option;
          item.classList.toggle('active', selected);
          item.setAttribute('aria-pressed', String(selected));
        });
        applyFilters();
        closeFilters();
      });
    });
    document.addEventListener('click', (event) => {
      if (filterPanel && !filterPanel.hidden && !filterPanel.contains(event.target) && !filterButton?.contains(event.target)) closeFilters();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeFilters();
      }
    });

    const translated = [...document.querySelectorAll('[data-en]')].map((element) => ({
      element, ru: element.textContent, en: element.dataset.en,
    }));
    const placeholders = [...document.querySelectorAll('[data-placeholder-en]')].map((element) => ({
      element, ru: element.getAttribute('placeholder'), en: element.dataset.placeholderEn,
    }));
    const accessibleLabels = [...document.querySelectorAll('[data-aria-label-en]')].map((element) => ({
      element, ru: element.getAttribute('aria-label'), en: element.dataset.ariaLabelEn,
    }));
    document.querySelectorAll('[data-lang]').forEach((button) => {
      button.addEventListener('click', () => {
        const language = button.dataset.lang === 'en' ? 'en' : 'ru';
        document.documentElement.lang = language;
        translated.forEach(({ element, ru, en }) => { element.textContent = language === 'en' ? en : ru; });
        placeholders.forEach(({ element, ru, en }) => element.setAttribute('placeholder', language === 'en' ? en : ru));
        accessibleLabels.forEach(({ element, ru, en }) => element.setAttribute('aria-label', language === 'en' ? en : ru));
        document.querySelectorAll('[data-lang]').forEach((item) => {
          const selected = item.dataset.lang === language;
          item.classList.toggle('active', selected);
          item.setAttribute('aria-pressed', String(selected));
        });
        document.dispatchEvent(new CustomEvent('ui:language', { detail: { language } }));
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
