/* ==========================================================================
   THE JOURNEY — CONTINUOUS PHOTO CAROUSEL
   Duplicates the visual strip for a seamless loop (clones are inert and hidden
   from assistive technology) and powers the enlarged photo viewer.
   ========================================================================== */
(function () {
  "use strict";

  var carousel = document.getElementById("journeyCarousel");
  var track = document.getElementById("journeyTrack");
  var viewer = document.getElementById("journeyViewer");
  var viewerImage = document.getElementById("journeyViewerImage");
  var closeButton = document.getElementById("journeyViewerClose");

  if (!carousel || !track || !viewer || !viewerImage || !closeButton) {
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var originals = Array.prototype.slice.call(track.children);
  var originalCount = originals.length;
  var currentSets = 1;
  var lastFocus = null;

  if (!originalCount) {
    return;
  }

  function addCopyOfStrip() {
    originals.forEach(function (slide) {
      var image = slide.querySelector("img");
      if (!image) {
        return;
      }

      var clone = document.createElement("div");
      clone.className = "journey-slide";
      clone.setAttribute("aria-hidden", "true");
      clone.appendChild(image.cloneNode(true));
      track.appendChild(clone);
    });
  }

  /* One set of photos moves out while an identical set takes its place. On a
     very wide screen one spare set is not always enough to cover the viewport
     at the end of the loop, so add more copies only when the measured width
     calls for them. */
  function ensureEnoughCopies() {
    var slideWidth = originals[0].getBoundingClientRect().width;
    if (!slideWidth) {
      return;
    }

    var setWidth = slideWidth * originalCount;
    var neededSets = Math.max(2, Math.ceil((carousel.clientWidth + setWidth) / setWidth));

    while (currentSets < neededSets) {
      addCopyOfStrip();
      currentSets += 1;
    }

    track.style.setProperty("--journey-shift", 100 / currentSets + "%");
  }

  if (!reduceMotion.matches) {
    /* Round the per-slide timing so short sets (nine photos) do not pick up a
       long floating-point tail in the custom property. */
    var durationSeconds = Math.round(originalCount * 2.4 * 10) / 10;
    track.style.setProperty("--journey-duration", durationSeconds + "s");
    ensureEnoughCopies();
    carousel.classList.add("is-ready");

    if ("ResizeObserver" in window) {
      var widthObserver = new ResizeObserver(ensureEnoughCopies);
      widthObserver.observe(carousel);
    } else {
      window.addEventListener("resize", ensureEnoughCopies);
    }
  }

  /* Only run the animation while the strip is near the viewport. */
  if ("IntersectionObserver" in window) {
    var visibilityObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          carousel.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { rootMargin: "200px 0px" }
    );

    visibilityObserver.observe(carousel);
  } else {
    carousel.classList.add("is-visible");
  }

  function originalFor(slide) {
    var index = originals.indexOf(slide);
    if (index !== -1) {
      return slide;
    }

    var trackIndex = Array.prototype.indexOf.call(track.children, slide);
    return originals[trackIndex % originalCount] || originals[0];
  }

  function openViewer(slide, restoreFocus) {
    var image = slide.querySelector("img");
    if (!image) {
      return;
    }

    lastFocus = restoreFocus ? originalFor(slide) : null;

    viewerImage.src = image.currentSrc || image.src;
    viewerImage.alt = image.alt || "Journey photograph";

    viewer.classList.add("is-open");
    viewer.setAttribute("aria-hidden", "false");
    carousel.classList.add("is-viewer-open");
    document.body.classList.add("journey-viewer-open");

    closeButton.focus({ preventScroll: true });
  }

  function closeViewer() {
    if (!viewer.classList.contains("is-open")) {
      return;
    }

    viewer.classList.remove("is-open");
    viewer.setAttribute("aria-hidden", "true");
    carousel.classList.remove("is-viewer-open");
    document.body.classList.remove("journey-viewer-open");

    if (lastFocus && document.contains(lastFocus)) {
      lastFocus.focus({ preventScroll: true });
    } else {
      /* Mouse and touch users do not need focus moved back into the strip;
         leaving it on the now-hidden close button would trap it there. */
      closeButton.blur();
    }

    lastFocus = null;

    window.setTimeout(function () {
      if (!viewer.classList.contains("is-open")) {
        viewerImage.removeAttribute("src");
      }
    }, 280);
  }

  track.addEventListener("click", function (event) {
    var slide = event.target.closest(".journey-slide");
    if (!slide || !track.contains(slide)) {
      return;
    }

    /* detail is 0 for keyboard activation; mouse and touch clicks do not need
       focus moved back into the moving strip when the viewer closes. */
    openViewer(slide, event.detail === 0);
  });

  closeButton.addEventListener("click", closeViewer);

  viewer.addEventListener("click", function (event) {
    if (event.target === viewer) {
      closeViewer();
    }
  });

  /* The close button is the only focusable control while the viewer is open. */
  viewer.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      event.preventDefault();
      closeButton.focus();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && viewer.classList.contains("is-open")) {
      closeViewer();
    }
  });
})();
