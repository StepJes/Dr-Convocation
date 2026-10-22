/* ==========================================================================
   Dr. Esha Mugutmal — Portfolio
   Vanilla JavaScript: navigation, scroll state, reveals, active section
   ========================================================================== */
(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("nav-menu");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktopQuery = window.matchMedia("(min-width: 901px)");

  /* ------------------------------------------------------------------
     Sticky navigation state
     ------------------------------------------------------------------ */
  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  function isMenuOpen() {
    return menu && menu.classList.contains("is-open");
  }

  function openMenu() {
    if (!menu || !toggle) return;
    menu.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("menu-open");
    var firstLink = menu.querySelector("a");
    if (firstLink) firstLink.focus();
  }

  function closeMenu(returnFocus) {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");
    if (returnFocus) toggle.focus();
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      if (isMenuOpen()) {
        closeMenu(false);
      } else {
        openMenu();
      }
    });

    /* Close after choosing a section */
    menu.addEventListener("click", function (event) {
      var target = event.target;
      if (target.closest("a")) {
        closeMenu(false);
      } else if (target === menu) {
        /* Click on the empty backdrop area */
        closeMenu(false);
      }
    });

    /* Close when clicking outside the menu and the toggle */
    document.addEventListener("click", function (event) {
      if (!isMenuOpen()) return;
      if (menu.contains(event.target) || toggle.contains(event.target)) return;
      closeMenu(false);
    });

    /* Escape closes and restores focus */
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isMenuOpen()) {
        closeMenu(true);
      }
    });

    /* Keep keyboard focus inside the open menu */
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Tab" || !isMenuOpen()) return;
      var focusable = Array.prototype.slice.call(
        menu.querySelectorAll("a[href], button:not([disabled])")
      );
      focusable.push(toggle);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    /* Reset state when switching to desktop */
    var onDesktopChange = function (event) {
      if (event.matches) closeMenu(false);
    };
    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", onDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(onDesktopChange);
    }
  }

  /* ------------------------------------------------------------------
     Scroll reveal animations
     ------------------------------------------------------------------ */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  function showAllReveals() {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    showAllReveals();
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });

    /* Safety net: never leave content hidden */
    window.addEventListener("load", function () {
      window.setTimeout(function () {
        revealItems.forEach(function (item) {
          var rect = item.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            item.classList.add("is-visible");
          }
        });
      }, 400);
    });
  }

  /* ------------------------------------------------------------------
     Active navigation state
     ------------------------------------------------------------------ */
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return null;
      var section = document.querySelector(id);
      return section ? { link: link, section: section } : null;
    })
    .filter(Boolean);

  function setActiveLink(activeLink) {
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link === activeLink);
      if (link === activeLink) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if (sections.length) {
    var activeLink = null;
    var activeTicking = false;

    var resolveActiveSection = function () {
      var offset = (header ? header.offsetHeight : 76) + 48;
      var current = sections[0];
      var atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;

      sections.forEach(function (item) {
        if (item.section.getBoundingClientRect().top <= offset) {
          current = item;
        }
      });

      if (atBottom) current = sections[sections.length - 1];

      if (current.link !== activeLink) {
        activeLink = current.link;
        setActiveLink(activeLink);
      }
      activeTicking = false;
    };

    var requestActiveUpdate = function () {
      if (activeTicking) return;
      activeTicking = true;
      window.requestAnimationFrame(resolveActiveSection);
    };

    resolveActiveSection();
    window.addEventListener("scroll", requestActiveUpdate, { passive: true });
    window.addEventListener("resize", requestActiveUpdate);
    window.addEventListener("hashchange", requestActiveUpdate);
    window.addEventListener("load", requestActiveUpdate);
  }

  /* ------------------------------------------------------------------
     Moments lightbox
     ------------------------------------------------------------------ */
  var momentBtns = Array.prototype.slice.call(document.querySelectorAll(".moment-btn"));
  var lightbox = document.getElementById("lightbox");

  if (momentBtns.length && lightbox) {
    var lbImg = lightbox.querySelector(".lightbox-img");
    var lbCaption = lightbox.querySelector(".lightbox-caption");
    var lbClose = lightbox.querySelector(".lightbox-close");
    var lbPrev = lightbox.querySelector(".lightbox-prev");
    var lbNext = lightbox.querySelector(".lightbox-next");
    var lbIndex = 0;
    var lbReturnFocus = null;

    var lbFocusable = [lbClose, lbPrev, lbNext];

    /* With a single photo there is nothing to browse: hide the arrows. */
    if (momentBtns.length < 2) {
      var lbHint = lightbox.querySelector(".lightbox-hint");
      lbPrev.hidden = true;
      lbNext.hidden = true;
      if (lbHint) lbHint.hidden = true;
      lbFocusable = [lbClose];
    }

    function lbShow(index) {
      lbIndex = (index + momentBtns.length) % momentBtns.length;
      var img = momentBtns[lbIndex].querySelector("img");
      var caption = momentBtns[lbIndex].querySelector(".moment-caption");
      lbImg.src = img.getAttribute("src");
      lbImg.alt = img.getAttribute("alt") || "";
      lbCaption.textContent = caption ? caption.textContent : "";
    }

    function lbOpen(index) {
      lbReturnFocus = document.activeElement;
      lbShow(index);
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      /* Allow the browser to paint the un-hidden node before fading in */
      window.requestAnimationFrame(function () {
        lightbox.classList.add("is-open");
      });
      lbClose.focus();
    }

    function lbCloseFn() {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");

      var hide = function () {
        lightbox.hidden = true;
        lbImg.src = "";
      };

      if (reduceMotion.matches) {
        hide();
      } else {
        window.setTimeout(hide, 260);
      }

      if (lbReturnFocus && typeof lbReturnFocus.focus === "function") {
        lbReturnFocus.focus();
      }
    }

    momentBtns.forEach(function (btn, index) {
      btn.addEventListener("click", function () {
        lbOpen(index);
      });
    });

    lbClose.addEventListener("click", lbCloseFn);
    lbPrev.addEventListener("click", function () { lbShow(lbIndex - 1); });
    lbNext.addEventListener("click", function () { lbShow(lbIndex + 1); });

    /* Backdrop click closes */
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lbCloseFn();
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;

      if (event.key === "Escape") {
        lbCloseFn();
      } else if (event.key === "ArrowLeft") {
        lbShow(lbIndex - 1);
      } else if (event.key === "ArrowRight") {
        lbShow(lbIndex + 1);
      } else if (event.key === "Tab") {
        /* Keep keyboard focus on the lightbox controls while it is open */
        var first = lbFocusable[0];
        var last = lbFocusable[lbFocusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ------------------------------------------------------------------
     Smooth scrolling fallback (browsers without scroll-behavior)
     ------------------------------------------------------------------ */
  if (!("scrollBehavior" in document.documentElement.style)) {
    document.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - 76);
    });
  }

  /* ------------------------------------------------------------------
     Floating note (Esha.html, Vaidavi.html and Neha.html)

     Non-modal note: the button toggles it, while Escape or an outside
     click dismisses it. Focus moves into the note on open and returns to
     the button when it is dismissed with the keyboard. Trio.html loads
     this file too, so the whole block is guarded by the presence of the
     markup.
     ------------------------------------------------------------------ */
  var noteFab = document.getElementById("noteFab");
  var notePopover = document.getElementById("notePopover");

  if (noteFab && notePopover) {
    var notePaper = notePopover.querySelector(".note-paper");

    function isNoteOpen() {
      return notePopover.classList.contains("is-open");
    }

    function openNote() {
      if (notePaper) {
        notePaper.scrollTop = 0;
      }

      notePopover.classList.add("is-open");
      noteFab.setAttribute("aria-expanded", "true");
      noteFab.setAttribute("aria-label", "Close note");
      notePopover.setAttribute("aria-hidden", "false");

      /* Wait for the visibility change to apply before moving focus into the
         sheet, which also lets arrow keys scroll a long note. */
      window.requestAnimationFrame(function () {
        if (isNoteOpen()) {
          (notePaper || notePopover).focus({ preventScroll: true });
        }
      });
    }

    function closeNote(restoreFocus) {
      if (!isNoteOpen()) return;

      /* Move focus out before hiding the dialog from assistive tech. This
         also covers an outside click on a non-focusable area, where focus
         would otherwise stay on the note. */
      if (restoreFocus || notePopover.contains(document.activeElement)) {
        noteFab.focus({ preventScroll: true });
      }

      notePopover.classList.remove("is-open");
      noteFab.setAttribute("aria-expanded", "false");
      noteFab.setAttribute("aria-label", "Open note");
      notePopover.setAttribute("aria-hidden", "true");
    }

    noteFab.addEventListener("click", function () {
      if (isNoteOpen()) {
        closeNote(false);
      } else {
        openNote();
      }
    });

    document.addEventListener("click", function (event) {
      if (
        isNoteOpen() &&
        !notePopover.contains(event.target) &&
        !noteFab.contains(event.target)
      ) {
        closeNote(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !isNoteOpen()) return;

      /* Let the photo lightbox handle its own Escape first. */
      if (document.body.classList.contains("lightbox-open")) return;

      closeNote(true);
    });
  }
})();
