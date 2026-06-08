(function(){
  var manifestLink = document.querySelector('link[rel="manifest"]');
  var manifestHref = manifestLink ? manifestLink.getAttribute('href') || '' : '';
  var appType = manifestHref.indexOf('management') !== -1 ? 'admin' : 'client';
  var installLabel = appType === 'admin' ? 'Instalar admin' : 'Instalar app';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('./service-worker.js?v=einnyadnails-v9').catch(function(){});
    });
  }

  window.addEventListener('beforeinstallprompt', function(event){
    event.preventDefault();
    window.einnyadInstallPrompt = event;
    document.querySelectorAll('[data-install-app]').forEach(function(button){
      button.textContent = button.textContent || installLabel;
      button.setAttribute('aria-label', installLabel);
      button.style.display = '';
    });
  });

  window.RTPWA = {
    appType: appType,
    install: async function(){
      var promptEvent = window.einnyadInstallPrompt;
      if (!promptEvent) return false;
      promptEvent.prompt();
      await promptEvent.userChoice.catch(function(){});
      window.einnyadInstallPrompt = null;
      document.querySelectorAll('[data-install-app]').forEach(function(button){ button.style.display = 'none'; });
      return true;
    }
  };
})();
