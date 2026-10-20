(() => {
  'use strict';

  const STORAGE_KEY = 'flower.greeting.20-10.v1';
  const defaultGreeting = {
    recipient: 'Minh Hiền',
    message: 'Nhân ngày Phụ nữ Việt Nam 20/10, chúc con luôn khỏe mạnh, bình an và có thật nhiều niềm vui.\n\nMong con được yêu thương từ những điều nhỏ nhất, có thời gian cho bản thân và tự tin theo đuổi những điều mình mong muốn.\n\nHôm nay và cả những ngày sau, hãy luôn mỉm cười theo cách của riêng con nhé.',
    sender: 'Một người quý mến bạn'
  };
  const dialog = document.getElementById('greetingCard');
  const openButton = document.getElementById('openCard');
  const reading = document.getElementById('cardReading');
  const status = document.getElementById('cardStatus');
  const closeButton = document.getElementById('closeCard');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopLayout = window.matchMedia('(min-width: 1100px)');
  const sceneElements = [...document.querySelectorAll('.bouquet-composition, .scene-footer')];
  const layoutAnimations = new Set();

  function reflowScene(changeLayout) {
    layoutAnimations.forEach(animation => animation.cancel());
    layoutAnimations.clear();
    const before = sceneElements.map(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    });
    changeLayout();
    if (motion.matches) return;
    sceneElements.forEach((element, index) => {
      const after = element.getBoundingClientRect();
      if (!after.width || !after.height) return;
      const dx = before[index].left - after.left - window.scrollX;
      const dy = before[index].top - after.top - window.scrollY;
      const scale = element.matches('.bouquet-composition')
        ? ` scale(${before[index].width / after.width}, ${before[index].height / after.height})` : '';
      const animation = element.animate([
        { transform: `translate(${dx}px, ${dy}px)${scale}` },
        { transform: 'none' }
      ], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
      layoutAnimations.add(animation);
      animation.onfinish = () => layoutAnimations.delete(animation);
    });
  }

  function revealCard() {
    const rect = dialog.getBoundingClientRect();
    if (!desktopLayout.matches || rect.top < 16 || rect.top > window.innerHeight * 0.35 || rect.bottom > window.innerHeight - 16) {
      dialog.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    }
  }

  function setCardOpen(open) {
    if (dialog.open === open) return;
    reflowScene(() => {
      if (open) {
        showReading();
        if (status) status.textContent = '';
        document.body.classList.add('card-open');
        dialog.show();
      } else {
        dialog.close();
        document.body.classList.remove('card-open');
        showReading();
      }
      openButton.setAttribute('aria-expanded', String(open));
      openButton.querySelector('.envelope-action').textContent = open ? 'Gấp thiệp' : 'Mở thiệp';
    });
    if (open) {
      closeButton.focus({ preventScroll: true });
      revealCard();
      document.dispatchEvent(new Event('bouquet:celebrate'));
    } else {
      openButton.focus({ preventScroll: true });
      const rect = openButton.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        openButton.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' });
      }
    }
  }

  motion.addEventListener('change', () => {
    if (motion.matches) {
      layoutAnimations.forEach(animation => animation.cancel());
      layoutAnimations.clear();
    }
  });

  let greeting = { ...defaultGreeting };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.recipient === 'string') {
      greeting = saved;
    }
  } catch {
    // Giữ nguyên greeting mặc định
  }

  function renderGreeting() {
    const recEl = document.getElementById('cardRecipient');
    const msgEl = document.getElementById('cardMessage');
    const sendEl = document.getElementById('cardSender');

    if (recEl) recEl.textContent = greeting.recipient;
    if (msgEl) {
      const paragraphs = greeting.message.split(/\n\s*\n/).map(text => {
        const paragraph = document.createElement('span');
        paragraph.className = 'message-paragraph';
        paragraph.textContent = text;
        return paragraph;
      });
      msgEl.replaceChildren(...paragraphs);
    }
    if (sendEl) sendEl.textContent = greeting.sender;
  }

  function showReading() {
    if (reading) reading.hidden = false;
    dialog.setAttribute('aria-labelledby', 'cardTitle');
    dialog.scrollTop = 0;
  }

  document.addEventListener('bouquet:ready', () => { openButton.hidden = false; });
  document.addEventListener('bouquet:rose', event => {
    const wish = document.getElementById('roseWish');
    if (!wish) return;
    wish.classList.remove('is-new');
    wish.textContent = event.detail.message;
    void wish.offsetWidth;
    wish.classList.add('is-new');
  });

  const replayBtn = document.getElementById('replayBloom');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      document.dispatchEvent(new Event('bouquet:replay'));
      const wish = document.getElementById('roseWish');
      if (wish) wish.textContent = '';
    });
  }

  openButton.addEventListener('click', () => setCardOpen(!dialog.open));
  closeButton.addEventListener('click', () => setCardOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.open && !event.defaultPrevented) {
      event.preventDefault();
      setCardOpen(false);
    }
  });

  dialog.addEventListener('close', () => {
    if (dialog.open || !document.body.classList.contains('card-open')) return;
    document.body.classList.remove('card-open');
    openButton.setAttribute('aria-expanded', 'false');
    openButton.querySelector('.envelope-action').textContent = 'Mở thiệp';
    showReading();
  });

  renderGreeting();
})();