// Runs in <head>, before the page is drawn, so a visitor who chose dark mode
// never sees a white flash first, and one who chose English never sees the
// page laid out right-to-left. A file rather than an inline script because
// the Content-Security-Policy only allows scripts from the site itself.
// The choices are made from the header (src/lib/theme.js, src/lib/i18n.js).
//
// The English site lives under /en, so the address is what sets the language;
// the saved choice only decides where a returning visitor lands when they open
// the bare domain. Search engines have no saved choice, so they always see the
// Hebrew page at the Hebrew address and the English one at /en.
(function () {
  var root = document.documentElement;
  var path = window.location.pathname;
  var onEnglish = path === '/en' || path.indexOf('/en/') === 0;

  try {
    // Admin, account and the one-off links are the shop's own tools; they are
    // Hebrew and must never be redirected out from under a signed-in owner.
    var redirectable = !onEnglish && !/^\/(admin|login|register|forgot-password|reset-password|profile|wishlist|review|mystery-box\/join)(\/|$)/.test(path);
    if (redirectable && localStorage.getItem('jl_lang') === 'en') {
      window.location.replace('/en' + (path === '/' ? '' : path) + window.location.search + window.location.hash);
      return;
    }
  } catch (e) { /* storage blocked - the Hebrew site it is */ }

  if (onEnglish) {
    root.setAttribute('lang', 'en');
    root.setAttribute('dir', 'ltr');
  }

  try {
    if (localStorage.getItem('jl_theme') === 'dark') {
      root.classList.add('dark');
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#0D1422');
    }
  } catch (e) { /* storage blocked - the light theme it is */ }
})();
