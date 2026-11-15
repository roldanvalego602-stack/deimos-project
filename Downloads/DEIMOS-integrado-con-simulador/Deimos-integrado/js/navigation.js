/* ==========================================================================
   DEIMOS PROJECT — Navigation & integration shell
   Vanilla JS, no dependencies. Exposes a single frozen namespace:
   window.DEIMOS (see README.md → "Integration API").
   ========================================================================== */

(function () {
  "use strict";

  var DEFAULT_VIEW = "mission-control";

  var VIEW_TITLES = {
    "mission-control": "Mission Control",
    "mars-explorer": "Mars Explorer",
    "survival-simulator": "Survival Simulator",
    "mission-archives": "Mission Archives",
    "about-mission": "About Mission"
  };

  // Stable mount points for external modules. Do not rename these IDs.
  var MODULE_CONTAINERS = {
    "mars-explorer": "mars-map-container",
    "survival-simulator": "survival-simulator-container",
    "mission-archives": "mission-archives-container"
  };

  var body = document.body;
  var menuButton = document.getElementById("dmx-menu-btn");
  var backdrop = document.getElementById("dmx-backdrop");
  var sidebar = document.getElementById("dmx-sidebar");
  var breadcrumb = document.getElementById("dmx-breadcrumb-current");
  var mobileQuery = window.matchMedia("(max-width: 960px)");

  var currentView = null;

  function isValidView(viewId) {
    return Object.prototype.hasOwnProperty.call(VIEW_TITLES, viewId);
  }

  function readViewFromHash() {
    var hash = (window.location.hash || "").replace("#", "");
    return isValidView(hash) ? hash : DEFAULT_VIEW;
  }

  function writeHash(viewId) {
    try {
      window.history.replaceState(null, "", "#" + viewId);
    } catch (error) {
      // Sandboxed or file:// contexts may block history updates; navigation still works.
    }
  }

  function updateNavState(viewId) {
    var navButtons = document.querySelectorAll(".dmx-nav__btn[data-dmx-nav]");
    navButtons.forEach(function (button) {
      if (button.getAttribute("data-dmx-nav") === viewId) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function updateViews(viewId) {
    var views = document.querySelectorAll(".dmx-view[data-dmx-view]");
    views.forEach(function (view) {
      view.hidden = view.getAttribute("data-dmx-view") !== viewId;
    });
  }

  function focusViewHeading(viewId) {
    var heading = document.querySelector('[data-dmx-view="' + viewId + '"] [data-dmx-heading]');
    if (heading) {
      heading.focus({ preventScroll: true });
    }
  }

  function navigateTo(viewId, options) {
    var settings = options || {};
    if (!isValidView(viewId)) {
      viewId = DEFAULT_VIEW;
    }

    var previousView = currentView;
    currentView = viewId;

    updateViews(viewId);
    updateNavState(viewId);

    if (breadcrumb) {
      breadcrumb.textContent = VIEW_TITLES[viewId];
    }
    document.title = VIEW_TITLES[viewId] + " · DEIMOS PROJECT";

    if (settings.updateHash !== false) {
      writeHash(viewId);
    }

    closeMobileNav();

    // Foco primero (con preventScroll), scroll después: evita doble salto.
    if (settings.moveFocus !== false) {
      focusViewHeading(viewId);
    }
    window.scrollTo({ top: 0, behavior: "auto" });

    document.dispatchEvent(
      new CustomEvent("deimos:viewchange", {
        detail: {
          view: viewId,
          previousView: previousView,
          containerId: MODULE_CONTAINERS[viewId] || null
        }
      })
    );
  }

  /* ---------- Mobile drawer ---------- */

  function setMobileNav(open) {
    body.setAttribute("data-dmx-nav-open", open ? "true" : "false");
    if (menuButton) {
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
      menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    }
  }

  function closeMobileNav() {
    if (body.getAttribute("data-dmx-nav-open") === "true") {
      setMobileNav(false);
    }
  }

  function toggleMobileNav() {
    var isOpen = body.getAttribute("data-dmx-nav-open") === "true";
    setMobileNav(!isOpen);
    if (!isOpen && sidebar) {
      var firstLink = sidebar.querySelector(".dmx-nav__btn");
      if (firstLink) firstLink.focus();
    }
  }

  /* ---------- UTC clock ---------- */

  function startClock() {
    var clock = document.getElementById("dmx-clock");
    if (!clock) return;

    function pad(value) {
      return String(value).padStart(2, "0");
    }

    function tick() {
      var now = new Date();
      var text =
        pad(now.getUTCHours()) + ":" + pad(now.getUTCMinutes()) + ":" + pad(now.getUTCSeconds()) + " UTC";
      clock.textContent = text;
      clock.setAttribute("datetime", now.toISOString());
    }

    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- Integration helpers ---------- */

  function getModuleContainer(moduleId) {
    var containerId = MODULE_CONTAINERS[moduleId] || moduleId;
    return document.getElementById(containerId);
  }

  function clearPlaceholder(moduleId) {
    var container = getModuleContainer(moduleId);
    if (!container) return null;

    container.querySelectorAll("[data-dmx-placeholder]").forEach(function (node) {
      node.remove();
    });
    container.setAttribute("data-dmx-state", "integrated");

    var viewId = Object.keys(MODULE_CONTAINERS).filter(function (key) {
      return MODULE_CONTAINERS[key] === container.id;
    })[0];

    if (viewId) {
      var navButton = document.querySelector('.dmx-nav__btn[data-dmx-nav="' + viewId + '"]');
      if (navButton) navButton.setAttribute("data-dmx-status", "integrated");
      document
        .querySelectorAll('[data-dmx-module-status="' + viewId + '"]')
        .forEach(function (tag) {
          tag.textContent = "Integrated";
          tag.classList.add("dmx-tag--cyan");
        });
    }

    document.dispatchEvent(
      new CustomEvent("deimos:module-ready", {
        detail: { module: moduleId, containerId: container.id, view: viewId || null }
      })
    );

    return container;
  }

  /* ---------- Event wiring ---------- */

  function handleNavClick(event) {
    var trigger = event.target.closest("[data-dmx-nav]");
    if (!trigger) return;
    event.preventDefault();
    navigateTo(trigger.getAttribute("data-dmx-nav"));
  }

  function init() {
    document.addEventListener("click", handleNavClick);

    if (menuButton) menuButton.addEventListener("click", toggleMobileNav);
    if (backdrop) backdrop.addEventListener("click", closeMobileNav);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && body.getAttribute("data-dmx-nav-open") === "true") {
        closeMobileNav();
        if (menuButton) menuButton.focus();
      }
    });

    mobileQuery.addEventListener("change", function (event) {
      if (!event.matches) closeMobileNav();
    });

    window.addEventListener("hashchange", function () {
      var viewId = readViewFromHash();
      if (viewId !== currentView) {
        navigateTo(viewId, { updateHash: false, moveFocus: false });
      }
    });

    var year = document.getElementById("dmx-year");
    if (year) year.textContent = String(new Date().getFullYear());

    startClock();
    navigateTo(readViewFromHash(), { updateHash: false, moveFocus: false });
  }

  window.DEIMOS = Object.freeze({
    navigateTo: navigateTo,
    getCurrentView: function () {
      return currentView;
    },
    getModuleContainer: getModuleContainer,
    clearPlaceholder: clearPlaceholder,
    containers: Object.freeze(Object.assign({}, MODULE_CONTAINERS))
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();