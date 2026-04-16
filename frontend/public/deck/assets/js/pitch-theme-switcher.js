/*
 * Pitch deck theme switcher -- pure logic, dependency-free.
 * Exposed on window.PitchThemeSwitcher for the inline HTML + for unit tests.
 * Tests load this file directly via vm or fetch.
 */
(function (root) {
  var STORAGE_KEY = 'springais-pitch-theme';
  var THEMES = ['light', 'dark', 'medieval'];
  var DEFAULT_THEME = 'medieval';

  function isValidTheme(name) {
    return THEMES.indexOf(name) !== -1;
  }

  function readStoredTheme(storage) {
    try {
      var value = (storage || root.localStorage).getItem(STORAGE_KEY);
      return isValidTheme(value) ? value : null;
    } catch (e) {
      return null;
    }
  }

  function writeStoredTheme(name, storage) {
    if (!isValidTheme(name)) return false;
    try {
      (storage || root.localStorage).setItem(STORAGE_KEY, name);
      return true;
    } catch (e) {
      return false;
    }
  }

  function resolveInitialTheme(storage) {
    return readStoredTheme(storage) || DEFAULT_THEME;
  }

  function applyTheme(name, doc) {
    var targetDoc = doc || root.document;
    var theme = isValidTheme(name) ? name : DEFAULT_THEME;
    var body = targetDoc.body;
    if (!body) return theme;

    for (var i = 0; i < THEMES.length; i++) {
      body.classList.remove('theme-' + THEMES[i]);
    }
    body.classList.add('theme-' + theme);
    targetDoc.documentElement.setAttribute('data-theme', theme);

    var buttons = targetDoc.querySelectorAll('[data-theme-btn]');
    for (var b = 0; b < buttons.length; b++) {
      var btn = buttons[b];
      btn.setAttribute('aria-pressed', btn.dataset.themeBtn === theme ? 'true' : 'false');
    }

    writeStoredTheme(theme);
    return theme;
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    THEMES: THEMES,
    DEFAULT_THEME: DEFAULT_THEME,
    isValidTheme: isValidTheme,
    readStoredTheme: readStoredTheme,
    writeStoredTheme: writeStoredTheme,
    resolveInitialTheme: resolveInitialTheme,
    applyTheme: applyTheme,
  };

  root.PitchThemeSwitcher = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
