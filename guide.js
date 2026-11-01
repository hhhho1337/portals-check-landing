(() => {
  'use strict';

  const start = () => {
    const dialog = document.querySelector('#connect-dialog');
    if (!dialog) return;

    const shell = dialog.querySelector('.guide-shell');
    const progress = dialog.querySelector('#guide-progress');
    const title = dialog.querySelector('#guide-title');
    const instruction = dialog.querySelector('#guide-instruction');
    const note = dialog.querySelector('#guide-note');
    const caption = dialog.querySelector('#guide-visual-caption');
    const reassurance = dialog.querySelector('#guide-reassurance');
    const reassuranceText = dialog.querySelector('#guide-reassurance-text');
    const markerGroup = dialog.querySelector('.guide-markers');
    const markers = [...dialog.querySelectorAll('.guide-markers span')];
    const back = dialog.querySelector('[data-guide-back]');
    const next = dialog.querySelector('[data-guide-next]');
    const nextLabel = next.querySelector('span');
    const closeButton = dialog.querySelector('[data-close-guide]');

    const copy = {
      ru: {
        title: 'Как подключить бота',
        progress: step => `ШАГ ${step} ИЗ 4`,
        back: 'Назад',
        next: 'Далее',
        done: 'Готово',
        close: 'Закрыть инструкцию',
        progressLabel: 'Прогресс подключения',
        reassurance: 'Оставьте включённым только доступ к сообщениям. Доступ к профилю и подаркам не требуется.',
        phone: {
          title: ['Telegram для бизнеса', 'Добавить чат-бота', 'Чат-бот', 'Права для бота'],
          profile: 'Профиль', bots: 'Чат-боты', business: 'Бизнес-настройки', replies: 'Быстрые ответы',
          bot: 'БОТ', add: 'Добавить', permissions: 'РАЗРЕШЕНИЯ', messages: 'Сообщения', accessProfile: 'Профиль', gifts: 'Подарки',
        },
        steps: [
          {
            instruction: 'Откройте «Telegram для бизнеса» и выберите «Чат-боты».',
            note: 'Раздел находится в настройках Telegram. Для бизнес-функций может потребоваться Telegram Premium.',
            caption: 'Откройте бизнес-настройки Telegram',
          },
          {
            instruction: 'Найдите бота по юзернейму <em>@PortalsCheckeer_bot</em>.',
            note: 'Введите юзернейм без пробелов и выберите Portals Check в результатах поиска.',
            caption: 'Используйте точный юзернейм бота',
          },
          {
            instruction: 'Проверьте название Portals Check и нажмите «Добавить».',
            note: 'Telegram покажет экран разрешений перед окончательным подключением.',
            caption: 'Добавьте Portals Check как бизнес-бота',
          },
          {
            instruction: 'Включите только «Сообщения» и подтвердите подключение.',
            note: 'После подключения вернитесь в Portals Check — подарки появятся после синхронизации.',
            caption: 'Разрешите доступ только к сообщениям',
          },
        ],
      },
      en: {
        title: 'Connect the bot',
        progress: step => `STEP ${step} OF 4`,
        back: 'Back',
        next: 'Next',
        done: 'Done',
        close: 'Close instructions',
        progressLabel: 'Connection progress',
        reassurance: 'Keep only Messages access enabled. Profile and Gifts access are not required.',
        phone: {
          title: ['Telegram Business', 'Add Chatbot', 'Chatbot', 'Bot permissions'],
          profile: 'Profile', bots: 'Chat Bots', business: 'Business settings', replies: 'Quick Replies',
          bot: 'BOT', add: 'Add', permissions: 'PERMISSIONS', messages: 'Messages', accessProfile: 'Profile', gifts: 'Gifts',
        },
        steps: [
          {
            instruction: 'Open “Telegram Business” and choose “Chat Bots”.',
            note: 'The section is in Telegram settings. Telegram Premium may be required for business features.',
            caption: 'Open Telegram business settings',
          },
          {
            instruction: 'Find the bot by its username <em>@PortalsCheckeer_bot</em>.',
            note: 'Enter the username without spaces and select Portals Check in the search results.',
            caption: 'Use the exact bot username',
          },
          {
            instruction: 'Check the Portals Check name and tap “Add”.',
            note: 'Telegram will show the permissions screen before the final connection.',
            caption: 'Add Portals Check as a business bot',
          },
          {
            instruction: 'Enable only “Messages” and confirm the connection.',
            note: 'Return to Portals Check after connecting. Gifts will appear after synchronization.',
            caption: 'Allow access to Messages only',
          },
        ],
      },
    };

    const phoneFields = {
      profile: '#guide-profile-label', bots: '#guide-bots-label', business: '#guide-business-note',
      replies: '#guide-replies-label', bot: '#guide-bot-label', add: '#guide-add-label',
      permissions: '#guide-permissions-label', messages: '#guide-messages-label',
      accessProfile: '#guide-profile-access-label', gifts: '#guide-gifts-access-label',
    };

    let language = document.documentElement.lang === 'en' ? 'en' : 'ru';
    let currentStep = 0;
    let opener = null;

    const render = () => {
      const currentCopy = copy[language];
      const step = currentCopy.steps[currentStep];
      shell.dataset.guideStep = String(currentStep + 1);
      progress.textContent = currentCopy.progress(currentStep + 1);
      title.textContent = currentCopy.title;
      instruction.innerHTML = step.instruction;
      note.textContent = step.note;
      caption.textContent = step.caption;
      back.textContent = currentCopy.back;
      back.disabled = currentStep === 0;
      nextLabel.textContent = currentStep === currentCopy.steps.length - 1 ? currentCopy.done : currentCopy.next;
      next.classList.toggle('is-done', currentStep === currentCopy.steps.length - 1);
      closeButton.setAttribute('aria-label', currentCopy.close);
      markerGroup.setAttribute('aria-label', currentCopy.progressLabel);
      markerGroup.setAttribute('aria-valuenow', String(currentStep + 1));
      reassurance.hidden = currentStep !== currentCopy.steps.length - 1;
      reassuranceText.textContent = currentCopy.reassurance;
      dialog.querySelector('#guide-phone-title').textContent = currentCopy.phone.title[currentStep];
      Object.entries(phoneFields).forEach(([key, selector]) => {
        const element = dialog.querySelector(selector);
        if (element) element.textContent = currentCopy.phone[key];
      });
      markers.forEach((marker, index) => {
        marker.classList.toggle('is-current', index === currentStep);
        marker.classList.toggle('is-complete', index < currentStep);
      });
    };

    const close = () => {
      if (dialog.open) dialog.close();
      opener?.focus();
    };

    document.querySelectorAll('[data-connect]').forEach(button => {
      button.addEventListener('click', () => {
        opener = button;
        currentStep = 0;
        render();
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      });
    });
    closeButton.addEventListener('click', close);
    back.addEventListener('click', () => {
      if (currentStep === 0) return;
      currentStep -= 1;
      render();
    });
    next.addEventListener('click', () => {
      if (currentStep === copy[language].steps.length - 1) {
        close();
        return;
      }
      currentStep += 1;
      render();
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      close();
    });
    document.addEventListener('ui:language', event => {
      language = event.detail.language === 'en' ? 'en' : 'ru';
      render();
    });

    render();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
