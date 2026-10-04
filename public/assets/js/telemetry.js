/**
 * IntegraSis Telemetry — Dwell Time & Scroll Depth Tracker
 * Mede tempo de leitura e profundidade de rolagem na página, enviando ao Cloudflare D1 via sendBeacon.
 */
(function() {
  var startTime = Date.now();
  var maxScroll = 0;
  var urlParams = new URLSearchParams(window.location.search);
  var userEmail = urlParams.get('email') || '';
  var sessionId = sessionStorage.getItem('integrasis_sid');
  
  if (!sessionId) {
    sessionId = 's_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    sessionStorage.setItem('integrasis_sid', sessionId);
  }

  // Se o e-mail veio na URL, memoriza na sessão
  if (userEmail) {
    sessionStorage.setItem('integrasis_lead_email', userEmail);
  } else {
    userEmail = sessionStorage.getItem('integrasis_lead_email') || '';
  }

  // Rastrear profundidade de rolagem
  function updateScroll() {
    var h = document.documentElement;
    var b = document.body;
    var st = 'scrollTop' in h ? h.scrollTop : b.scrollTop;
    var sh = 'scrollHeight' in h ? h.scrollHeight : b.scrollHeight;
    var ch = h.clientHeight;
    var scrollPercent = Math.min(100, Math.round((st / (sh - ch)) * 100)) || 0;
    if (scrollPercent > maxScroll) {
      maxScroll = scrollPercent;
    }
  }

  window.addEventListener('scroll', updateScroll, { passive: true });

  // Enviar telemetria ao sair ou a cada pulso
  function sendTelemetry(isFinal) {
    var seconds = Math.round((Date.now() - startTime) / 1000);
    if (seconds < 2) return; // Ignora se foi menos de 2s

    var payload = JSON.stringify({
      email: userEmail,
      path: window.location.pathname,
      seconds: seconds,
      max_scroll_percent: maxScroll,
      session_id: sessionId
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry', payload);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/telemetry', !isFinal);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    }
  }

  // Pulso periódico a cada 30 segundos enquanto o usuário lê
  setInterval(function() {
    sendTelemetry(false);
  }, 30000);

  // Disparo final no fechamento da página
  window.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      sendTelemetry(true);
    }
  });
  window.addEventListener('pagehide', function() {
    sendTelemetry(true);
  });
})();
