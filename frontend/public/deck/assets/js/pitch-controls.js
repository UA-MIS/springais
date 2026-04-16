/*
 * Pitch deck controls: theme switcher wiring, slide counter, aria-live announcer,
 * exit-to-login, Esc-twice handler, and reveal.js initialization.
 * Depends on:
 *   - window.Reveal (loaded from vendor/reveal.js before this script)
 *   - window.PitchThemeSwitcher (loaded from pitch-theme-switcher.js before this)
 */
(function () {
  'use strict';

  var TS = window.PitchThemeSwitcher;
  if (!TS) {
    console.error('PitchThemeSwitcher is not loaded; theme switching disabled.');
  }

  function bindThemeSwitcher() {
    if (!TS) return;
    var buttons = document.querySelectorAll('[data-theme-btn]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        TS.applyTheme(btn.dataset.themeBtn);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === '1') TS.applyTheme('light');
      else if (e.key === '2') TS.applyTheme('dark');
      else if (e.key === '3') TS.applyTheme('medieval');
    });

    TS.applyTheme(TS.resolveInitialTheme());
  }

  function bindNavHint() {
    var hint = document.querySelector('.nav-hint');
    if (!hint) return;
    setTimeout(function () { hint.classList.add('show'); }, 500);
    setTimeout(function () { hint.classList.remove('show'); }, 3500);
    setTimeout(function () { hint.remove(); }, 4500);
  }

  function bindEscExit() {
    var escCount = 0;
    var resetTimer = null;
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      escCount += 1;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () { escCount = 0; }, 800);
      if (escCount >= 2) {
        escCount = 0;
        exitDeck();
      }
    });
  }

  function exitDeck() {
    try {
      if (window.opener && !window.opener.closed) {
        window.close();
        return;
      }
    } catch (_) {}
    window.location.href = '/';
  }

  function bindExitLink() {
    var link = document.querySelector('[data-exit-deck]');
    if (!link) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      exitDeck();
    });
  }

  function bindHeroEnter() {
    var btn = document.querySelector('[data-hero-enter]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.Reveal) window.Reveal.next();
    });
  }

  function bindExpandDialogs() {
    var triggers = document.querySelectorAll('[data-expand-trigger]');
    triggers.forEach(function (trigger) {
      var targetId = trigger.getAttribute('data-expand-trigger');
      var dialog = document.getElementById(targetId);
      if (!dialog) return;
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      });

      var closeBtn = dialog.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          if (typeof dialog.close === 'function') dialog.close();
          else dialog.removeAttribute('open');
        });
      }
    });
  }

  function updateSlideCounter() {
    var counter = document.querySelector('.slide-counter');
    if (!counter || !window.Reveal) return;
    var idx = window.Reveal.getIndices();
    var horizontalSlides = document.querySelectorAll('.reveal .slides > section');
    var total = horizontalSlides.length;
    counter.textContent = (idx.h + 1) + ' / ' + total;
  }

  function bindSlideCounter() {
    if (!window.Reveal) return;
    var counter = document.querySelector('.slide-counter');
    updateSlideCounter();
    var dimTimer = null;
    function markActive() {
      if (!counter) return;
      counter.classList.remove('dim');
      clearTimeout(dimTimer);
      dimTimer = setTimeout(function () { counter.classList.add('dim'); }, 3000);
    }
    markActive();
    window.Reveal.on('slidechanged', function () {
      updateSlideCounter();
      updateAnnouncer();
      markActive();
    });
  }

  function updateAnnouncer() {
    var announcer = document.querySelector('.slide-announcer');
    if (!announcer || !window.Reveal) return;
    var idx = window.Reveal.getIndices();
    var current = window.Reveal.getCurrentSlide();
    if (!current) return;
    var title = current.querySelector('h1, h2');
    var total = document.querySelectorAll('.reveal .slides > section').length;
    var titleText = title ? title.textContent.trim() : ('Slide ' + (idx.h + 1));
    announcer.textContent = (idx.h + 1) + ' of ' + total + ': ' + titleText;
  }

  function initReveal() {
    if (!window.Reveal) {
      console.error('Reveal.js is not loaded.');
      return;
    }
    window.Reveal.initialize({
      controls: false,
      progress: true,
      slideNumber: false,
      history: true,
      keyboard: true,
      overview: true,
      center: false,
      transition: 'slide',
      transitionSpeed: 'default',
      backgroundTransition: 'fade',
      loop: false,
      autoSlide: 0,
      fragments: true,
      fragmentInURL: false,
      mouseWheel: false,
      hideAddressBar: false,
      hash: true,
      respondToHashChanges: true,
      width: 1600,
      height: 900,
      margin: 0.04,
      minScale: 0.4,
      maxScale: 1.5,
    }).then(function () {
      updateAnnouncer();
      updateSlideCounter();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindThemeSwitcher();
    bindExitLink();
    bindEscExit();
    bindHeroEnter();
    bindExpandDialogs();
    bindNavHint();
    initReveal();
    bindSlideCounter();
  });
})();
