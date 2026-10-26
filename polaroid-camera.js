/* ==========================================================================
   Polaroid keepsake camera
   Shutter -> flash -> printed cover -> tap to reveal -> enlarged viewer.
   Wrapped in an IIFE so it shares no globals with script.js.
   ========================================================================== */
(function () {
  "use strict";

  var shutter = document.getElementById("shutter");
  var captureBtn = document.getElementById("captureBtn");
  var polaroid = document.getElementById("polaroid");
  var flashEffect = document.getElementById("flashEffect");
  var cameraWrap = document.getElementById("cameraWrap");
  var revealCover = document.getElementById("revealCover");
  var photo = document.getElementById("photo");

  var photoViewer = document.getElementById("photoViewer");
  var viewerPhoto = document.getElementById("viewerPhoto");
  var closeViewer = document.getElementById("closeViewer");

  if (
    !shutter || !captureBtn || !polaroid || !flashEffect || !revealCover ||
    !photo || !photoViewer || !viewerPhoto || !closeViewer
  ) {
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var isTakingPhoto = false;
  var isRevealed = false;
  var isDismissing = false;
  var printTimer = null;
  var finishTimer = null;
  var dismissTimer = null;

  /* ------------------------------------------------------------------
     Viewer state
     ------------------------------------------------------------------ */
  function setViewerOpen(isOpen) {
    photoViewer.classList.toggle("active", isOpen);
    photoViewer.setAttribute("aria-hidden", isOpen ? "false" : "true");
    document.body.classList.toggle("polaroid-viewer-open", isOpen);
  }

  /* ------------------------------------------------------------------
     Take the picture
     ------------------------------------------------------------------ */
  function takePicture() {
    if (isTakingPhoto) return;

    isTakingPhoto = true;
    isRevealed = false;
    isDismissing = false;

    window.clearTimeout(printTimer);
    window.clearTimeout(finishTimer);
    window.clearTimeout(dismissTimer);

    /* Close the enlarged view if it is open */
    setViewerOpen(false);
    viewerPhoto.removeAttribute("src");

    /* Restore the grey-white cover */
    revealCover.classList.remove("hidden");
    revealCover.setAttribute("aria-label", "Tap to reveal the photo");

    /* Hide the previous photo and reset its animation */
    polaroid.classList.remove("show", "developing", "fade-out");

    flashEffect.classList.remove("fire");
    void flashEffect.offsetWidth;
    void polaroid.offsetWidth;

    /* Camera flash */
    flashEffect.classList.add("fire");

    /* Camera shake (skipped for reduced motion) */
    if (
      cameraWrap &&
      !reduceMotion.matches &&
      typeof cameraWrap.animate === "function"
    ) {
      cameraWrap.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-4px)" },
          { transform: "translateX(4px)" },
          { transform: "translateX(0)" }
        ],
        { duration: 350, easing: "ease-out" }
      );
    }

    /* Print the covered photograph */
    printTimer = window.setTimeout(function () {
      polaroid.classList.add("show", "developing");
    }, 350);

    /* Finish the printing animation */
    finishTimer = window.setTimeout(function () {
      polaroid.classList.remove("developing");
      isTakingPhoto = false;
    }, 1800);
  }

  /* ------------------------------------------------------------------
     Reveal the covered photo
     ------------------------------------------------------------------ */
  function revealPhoto() {
    if (isRevealed || isDismissing) return;
    if (!polaroid.classList.contains("show")) return;

    isRevealed = true;

    revealCover.classList.add("hidden");
    revealCover.setAttribute("aria-label", "Photo revealed");
  }

  /* ------------------------------------------------------------------
     Enlarged viewer
     ------------------------------------------------------------------ */
  function openPhotoViewer() {
    if (!isRevealed || isDismissing) return;
    if (!polaroid.classList.contains("show")) return;

    viewerPhoto.src = photo.currentSrc || photo.src;
    viewerPhoto.alt = photo.alt || "Enlarged Polaroid photograph";

    setViewerOpen(true);
    closeViewer.focus({ preventScroll: true });
  }

  function closePhotoViewer() {
    var wasOpen = photoViewer.classList.contains("active");

    setViewerOpen(false);

    if (wasOpen && polaroid.classList.contains("show")) {
      polaroid.focus({ preventScroll: true });
    }
  }

  /* ------------------------------------------------------------------
     Put the printed photo away
     ------------------------------------------------------------------ */
  function dismissPhoto() {
    if (isDismissing) return;
    if (!polaroid.classList.contains("show")) return;

    isDismissing = true;
    setViewerOpen(false);

    polaroid.classList.remove("developing");
    polaroid.classList.add("fade-out");

    dismissTimer = window.setTimeout(function () {
      polaroid.classList.remove("show", "fade-out");
      revealCover.classList.remove("hidden");
      isRevealed = false;
      isDismissing = false;
      viewerPhoto.removeAttribute("src");

      if (document.activeElement === polaroid) {
        captureBtn.focus({ preventScroll: true });
      }
    }, 500);
  }

  /* ------------------------------------------------------------------
     Camera controls
     ------------------------------------------------------------------ */
  shutter.addEventListener("click", takePicture);
  captureBtn.addEventListener("click", takePicture);

  /* Tap the cover to reveal the image */
  revealCover.addEventListener("click", revealPhoto);

  revealCover.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      revealPhoto();
    }
  });

  /* Tap the revealed Polaroid to enlarge it */
  photo.addEventListener("click", function (event) {
    event.stopPropagation();
    openPhotoViewer();
  });

  /* Also allow clicking the revealed Polaroid's white border */
  polaroid.addEventListener("click", function (event) {
    if (event.target === polaroid && isRevealed) {
      openPhotoViewer();
    }
  });

  /* Keyboard access once revealed */
  polaroid.addEventListener("keydown", function (event) {
    if (event.target !== polaroid) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPhotoViewer();
    }
  });

  /* X button closes the enlarged view only */
  closeViewer.addEventListener("click", function (event) {
    event.stopPropagation();
    closePhotoViewer();
  });

  /* Clicking the dark backdrop closes the view and the printed photo */
  photoViewer.addEventListener("click", function (event) {
    if (event.target === photoViewer) {
      dismissPhoto();
    }
  });

  /* Clicking anywhere outside the printed Polaroid dismisses it.
     Camera controls are excluded so the shutter still works. */
  document.addEventListener("click", function (event) {
    if (!polaroid.classList.contains("show")) return;
    if (photoViewer.classList.contains("active")) return;

    if (
      !polaroid.contains(event.target) &&
      !shutter.contains(event.target) &&
      !captureBtn.contains(event.target)
    ) {
      dismissPhoto();
    }
  });

  /* Escape closes the enlarged viewer, or puts the photo away */
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    if (photoViewer.classList.contains("active")) {
      closePhotoViewer();
    } else {
      dismissPhoto();
    }
  });
})();
