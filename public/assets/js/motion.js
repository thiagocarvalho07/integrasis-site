/* ============================================================
   INTEGRASIS — Motion (scroll-trigger, NUNCA scroll-jacking)
   Usa IntersectionObserver (GPU-friendly). Uma revelação por vez
   com hierarquia (classe .reveal + delay opcional).
   Respeita prefers-reduced-motion (acessibilidade).
   ============================================================ */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Se o usuário prefere menos motion, tudo já está visível via CSS.
  if (reduce) return;

  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    // Fallback: mostra tudo
    items.forEach(function (el) { el.classList.add('in-view'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target); // revela uma vez e desliga (performance)
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  items.forEach(function (el) { io.observe(el); });
})();
