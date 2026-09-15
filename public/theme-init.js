// Runs in <head>, before the page is drawn, so a visitor who chose dark mode
// never sees a white flash first. A file rather than an inline script because
// the Content-Security-Policy only allows scripts from the site itself.
// The choice is made from the header (src/lib/theme.js).
(function () {
  var root = document.documentElement;
  try {
    if (localStorage.getItem('jl_theme') === 'dark') {
      root.classList.add('dark');
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#0D1422');
    }
  } catch (e) { /* storage blocked - the light theme it is */ }
})();
