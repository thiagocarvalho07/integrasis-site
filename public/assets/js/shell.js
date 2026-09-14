/* ============================================================
   INTEGRASIS — Shell global (header/footer)
   - Resolve aria-current="page" em [data-active-if=...] (estático
     já aplicado no HTML; este JS cobre caminhos com trailing slash)
   - Toggle de menu mobile acessível: aria-expanded, foco, Escape,
     clique-fora, prefers-reduced-motion
   Não depende de frameworks. Roda após DOM pronto.
   ============================================================ */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Estado ativo do nav (aria-current) ---- */
  var path = window.location.pathname;
  // normaliza: remove index.html final e trailing slash (deixa só a rota)
  var norm = path.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
  document.querySelectorAll('[data-active-if]').forEach(function (a) {
    var want = a.getAttribute('data-active-if').replace(/\/+$/, '');
    if (want === norm) { a.setAttribute('aria-current', 'page'); }
  });

  /* ---- Menu mobile ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (!toggle || !nav) return;

  var OPEN = 'is-open';

  function close() {
    nav.classList.remove(OPEN);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  }
  function open() {
    nav.classList.add(OPEN);
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu');
    // foco no primeiro link
    var first = nav.querySelector('a');
    if (first) first.focus();
  }
  function toggleNav() {
    if (nav.classList.contains(OPEN)) { close(); }
    else { open(); }
  }

  if (!toggle.hasAttribute('aria-expanded')) { toggle.setAttribute('aria-expanded', 'false'); }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleNav();
  });

  // Esc fecha e devolve foco ao botão
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains(OPEN)) {
      close();
      toggle.focus();
    }
  });

  // Clique fora fecha
  document.addEventListener('click', function (e) {
    if (nav.classList.contains(OPEN) && !nav.contains(e.target) && !toggle.contains(e.target)) {
      close();
    }
  });

  // Clicou num link interno, fecha
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { close(); }
  });

  // Respeita prefers-reduced-motion: sem slide (as classes CSS cuidam disso)
  if (reduce) {
    nav.style.transition = 'none';
    toggle.style.transition = 'none';
  }
})();
