// Runs in <head>, before the page is drawn, so a visitor who chose dark mode
// never sees a white flash first, and one who chose English never sees the
// page laid out right-to-left. A file rather than an inline script because
// the Content-Security-Policy only allows scripts from the site itself.
// The choices are made from the header (src/lib/theme.js, src/lib/i18n.js).
(function () {
  var root = document.documentElement;
  try {
    if (localStorage.getItem('jl_lang') === 'en') {
      root.setAttribute('lang', 'en');
      root.setAttribute('dir', 'ltr');
    }
    if (localStorage.getItem('jl_theme') === 'dark') {
      root.classList.add('dark');
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#0D1422');
    }
  } catch (e) { /* storage blocked - the light theme it is */ }
})();
