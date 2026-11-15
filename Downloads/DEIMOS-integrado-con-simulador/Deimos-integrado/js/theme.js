(function () {
  "use strict";

  var STORAGE_KEY = "deimos-theme";
  var root = document.documentElement;

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  
  function storeTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }
  
  function getCurrentTheme() {
    return root.getAttribute("data-dmx-theme") === "light" ? "light" : "dark";
  }

  function updateButtons(theme) {
    var buttons = document.querySelectorAll(".dmx-theme-btn");
    buttons.forEach(function (btn) {
      var isLight = theme === "light";
      btn.setAttribute("aria-pressed", isLight ? "true" : "false");
    });
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-dmx-theme", theme);
    if (persist) storeTheme(theme);
    updateButtons(theme);
  }

  function toggleTheme() {
    var next = getCurrentTheme() === "light" ? "dark" : "light";
    applyTheme(next, true);
  }

  function init() {
    var theme = root.getAttribute("data-dmx-theme") || getStoredTheme() || "dark";
    applyTheme(theme, false);

    var buttons = document.querySelectorAll(".dmx-theme-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        toggleTheme();
      });
    });
  }

  window.DEIMOSTheme = Object.freeze({
    get: getCurrentTheme,
    set: function (theme) { applyTheme(theme === "light" ? "light" : "dark", true); },
    toggle: toggleTheme
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();