/* EinnyadNails - shared frontend configuration */
window.EINNYAD_SYSTEM = {
  appName: 'EinnyadNails Booking System',
  businessName: 'EinnyadNails',
  licenseName: 'EinnyadNails Booking System',
  licenseBy: 'Visual Event Network',
  currency: 'CAD',
  apiTimeoutMs: 60000,

  clientApiUrl: 'https://script.google.com/macros/s/AKfycby-8JObcZY4wzlqQn-pJqOlkDYt5ZBAQ-0bXLJ0SY7wn_NjiDVhscgNi2nVXxe-Ft8Y/exec',
  adminApiUrl: 'https://script.google.com/macros/s/AKfycbz1hX9WxBlPpAvrkn3_cZkWPTd6z6Uh1m0IpxaSDgtTzR1CN9yuKjKCCqOlaHQplK4J/exec',

  adminPage: 'admin.html',
  indexPage: 'index.html'
};

(function(){
  function buildUrl(baseUrl, params){
    var query = Object.keys(params)
      .filter(function(key){ return params[key] !== undefined && params[key] !== null && params[key] !== ''; })
      .map(function(key){
        var value = params[key];
        return encodeURIComponent(key) + '=' + encodeURIComponent(typeof value === 'string' ? value : JSON.stringify(value));
      })
      .join('&');
    return baseUrl + (baseUrl.indexOf('?') === -1 ? '?' : '&') + query;
  }

  function jsonp(baseUrl, action, payload){
    payload = payload || {};
    var attempts = 0;
    return new Promise(function(resolve, reject){
      if(!baseUrl || baseUrl.indexOf('PASTE' + '_') !== -1){
        reject(new Error('API URL is not configured yet in assets/config.js'));
        return;
      }

      function start(){
        attempts += 1;
        var callback = 'en_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        var script = document.createElement('script');
        script.async = true;
        script.referrerPolicy = 'no-referrer-when-downgrade';
        var timer = setTimeout(function(){
          cleanup();
          retryOrReject(new Error('API request timed out'));
        }, window.EINNYAD_SYSTEM.apiTimeoutMs || 60000);

        function cleanup(){
          clearTimeout(timer);
          try { delete window[callback]; } catch(err) { window[callback] = undefined; }
          if(script.parentNode) script.parentNode.removeChild(script);
        }

        function retryOrReject(error){
          if(attempts < 2) {
            setTimeout(start, 900);
            return;
          }
          reject(error);
        }

        window[callback] = function(response){
          cleanup();
          if(response && response.success) resolve(response.data || response);
          else reject(new Error((response && response.message) || 'API error'));
        };

        script.onerror = function(){
          cleanup();
          retryOrReject(new Error('Could not reach API'));
        };

        script.src = buildUrl(baseUrl, {
          action: action,
          callback: callback,
          payload: JSON.stringify(payload || {}),
          _: Date.now() + '_' + attempts
        });
        document.body.appendChild(script);
      }
      start();
    });
  }

  window.RTApi = {
  client: function(action, payload){ return jsonp(window.EINNYAD_SYSTEM.clientApiUrl, action, payload); },
  admin: function(action, payload){ return jsonp(window.EINNYAD_SYSTEM.adminApiUrl, action, payload); },
    money: function(value){ return '$' + Number(value || 0).toFixed(2) + ' CAD'; },
    esc: function(value){
      return String(value == null ? '' : value).replace(/[&<>"']/g, function(character){
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
      });
    }
  };
})();
