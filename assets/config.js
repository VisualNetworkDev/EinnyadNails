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

  var readActions = new Set(['health', 'getClientData', 'getSalonConfig', 'getConfig', 'getServices', 'getPromotions', 'getReviews', 'getTestimonials', 'getPaymentsConfig', 'getAvailability', 'getAvailableSlots', 'getAvailableTimes', 'validatePromotion', 'getAppointmentReceipt', 'getAppointmentByQr', 'getAdminData', 'getDashboard', 'getAppointments', 'getPhotoStorage', 'getLogs', 'verifyAppointmentQr', 'getNotificationData']);
  var inFlightReads = new Map();
  function jsonp(baseUrl, action, payload){
    var key = baseUrl + '|' + action + '|' + JSON.stringify(payload || {});
    if(readActions.has(action) && inFlightReads.has(key)) return inFlightReads.get(key);
    var request = jsonpRequest(baseUrl, action, payload);
    if(readActions.has(action)){
      inFlightReads.set(key, request);
      request.then(function(){ inFlightReads.delete(key); }, function(){ inFlightReads.delete(key); });
    }
    return request;
  }
  function jsonpRequest(baseUrl, action, payload){
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
          if(readActions.has(action) && attempts < 2) {
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

  // Apps Script HTML bridge keeps passwords, tokens and mutation payloads out of URLs.
  // A timed-out write is never automatically replayed: it may already have completed.
  function postBridge(baseUrl, marker, action, payload){
    return new Promise(function(resolve, reject){
      var requestId = 'en_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      var frame = document.createElement('iframe');
      frame.name = 'bridge_' + requestId;
      frame.hidden = true;
      var form = document.createElement('form');
      form.method = 'POST'; form.action = baseUrl; form.target = frame.name; form.hidden = true;
      var fields = {bridge:'1', requestId:requestId, action:action, payload:JSON.stringify(payload || {})};
      Object.keys(fields).forEach(function(key){
        var input = document.createElement('input');
        input.type = 'hidden'; input.name = key; input.value = fields[key]; form.appendChild(input);
      });
      var timer = setTimeout(function(){
        cleanup(); reject(new Error('No se recibió confirmación. Actualiza los datos antes de repetir la operación.'));
      }, action === 'uploadImage' ? 130000 : (window.EINNYAD_SYSTEM.apiTimeoutMs || 60000));
      function cleanup(){ clearTimeout(timer); window.removeEventListener('message', onMessage); form.remove(); frame.remove(); }
      function onMessage(event){
        var host;
        try { var origin = new URL(event.origin); if(origin.protocol !== 'https:') return; host = origin.hostname; } catch(_) { return; }
        if(host !== 'script.google.com' && host !== 'script.googleusercontent.com' && !host.endsWith('.script.googleusercontent.com') && !host.endsWith('-script.googleusercontent.com')) return;
        var response = event.data;
        if(typeof response === 'string') { try { response = JSON.parse(response); } catch(_) { return; } }
        if(!response || response[marker] !== true || response.requestId !== requestId) return;
        cleanup();
        if(response.success === true) resolve(response.data || {});
        else reject(new Error(response.message || 'No se pudo completar la operación.'));
      }
      window.addEventListener('message', onMessage);
      document.body.appendChild(frame); document.body.appendChild(form); form.submit();
    });
  }

  window.RTApi = {
  client: function(action, payload){ return jsonp(window.EINNYAD_SYSTEM.clientApiUrl, action, payload); },
  admin: function(action, payload){ return jsonp(window.EINNYAD_SYSTEM.adminApiUrl, action, payload); },
    postAdmin: function(action, payload){ return postBridge(window.EINNYAD_SYSTEM.adminApiUrl, 'einnyadAdminApi', action, payload); },
    postClient: function(action, payload){ return postBridge(window.EINNYAD_SYSTEM.clientApiUrl, 'einnyadClientApi', action, payload); },
    isReadAction: function(action){ return readActions.has(action); },
    money: function(value){ return '$' + Number(value || 0).toFixed(2) + ' CAD'; },
    esc: function(value){
      return String(value == null ? '' : value).replace(/[&<>"']/g, function(character){
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
      });
    }
  };
})();
