(function () {
  let hidden = false;
  let fallbackTimer = null;

  function intro() {
    return document.getElementById('appIntro');
  }

  function setStep(message) {
    const text = document.getElementById('appIntroStep');
    if (text && message) text.textContent = window.RTI18N ? window.RTI18N.translate(message) : message;
  }

  function hide(delay) {
    const box = intro();
    if (!box || hidden) return;
    hidden = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    setTimeout(() => {
      box.classList.add('closing');
      box.setAttribute('aria-hidden', 'true');
      document.body.classList.add('intro-ready');
      setTimeout(() => { box.style.display = 'none'; }, 420);
    }, Number(delay || 120));
  }

  function scheduleFallback() {
    const box = intro();
    if (!box) return;
    const timeout = Number(box.getAttribute('data-timeout') || 18000);
    if (!timeout) return;
    fallbackTimer = setTimeout(() => {
      setStep('La carga tarda más de lo normal. Seguimos preparando la página.');
    }, timeout);
  }

  function init() {
    const box = intro();
    if (!box || hidden) return;
    scheduleFallback();
    if (box.getAttribute('data-auto-hide') !== 'false') hide(Number(box.getAttribute('data-auto-hide-delay') || 650));
  }

  window.RTIntro = { setStep, hide };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
