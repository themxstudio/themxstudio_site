document.querySelectorAll("[data-sales-video]").forEach((player) => {
  const video = player.querySelector("video");
  const poster = player.querySelector(".brisbane-sales-video__poster");
  const playButton = player.querySelector(".brisbane-sales-video__play");
  const dialog = document.getElementById(playButton?.getAttribute("aria-controls"));
  const mount = dialog?.querySelector("[data-sales-video-mount]");
  const closeButton = dialog?.querySelector(".brisbane-sales-video__close");
  if (!video || !poster || !playButton || !mount || !closeButton || typeof dialog.showModal !== "function") return;

  mount.append(video);
  video.controls = true;
  poster.hidden = false;
  playButton.hidden = false;

  // Keep the browser's controls; clear them after 0.5 seconds without activity.
  let controlsTimer;
  let pointerDown = false;
  let lastPointerX;
  let lastPointerY;
  const showControls = () => {
    window.clearTimeout(controlsTimer);
    if (!video.controls) video.controls = true;
    if (!dialog.open || video.paused || video.ended || video.seeking || pointerDown || video.readyState < 3) return;
    controlsTimer = window.setTimeout(() => {
      if (!dialog.open || video.paused || video.ended || video.seeking || pointerDown) return;
      if (video.controls) {
        video.controls = false;
        if (document.activeElement === video) video.focus({ preventScroll: true });
      }
    }, 500);
  };
  ["playing", "pause", "ended", "waiting", "seeking", "seeked", "volumechange"].forEach((event) => {
    video.addEventListener(event, showControls);
  });
  document.addEventListener("pointermove", (event) => {
    // Native controls can cause a stationary pointer event when they disappear.
    // Only real position changes should bring them back.
    if (event.clientX === lastPointerX && event.clientY === lastPointerY) return;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    if (dialog.open) showControls();
  }, { passive: true, capture: true });
  document.addEventListener("pointerdown", (event) => {
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    if (!dialog.open) return;
    pointerDown = true;
    showControls();
  }, { passive: true, capture: true });
  const releasePointer = () => {
    pointerDown = false;
    if (dialog.open) showControls();
  };
  document.addEventListener("pointerup", releasePointer, true);
  document.addEventListener("pointercancel", releasePointer, true);
  const startPlayback = async () => {
    if (video.ended) video.currentTime = 0;
    try {
      const playback = video.play();
      showControls();
      await playback;
    } catch {
      showControls();
    }
  };
  const isSpaceShortcut = (event) => {
    if (!dialog.open || (event.code !== "Space" && event.key !== " ") ||
        event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return false;
    const target = event.target;
    return !(target instanceof HTMLElement &&
      (target.isContentEditable || target.closest("input:not([type=range]), textarea, select")));
  };
  // Handle Space before native controls or the focused close button can consume it.
  window.addEventListener("keydown", (event) => {
    if (!dialog.open) return;
    showControls();
    if (!isSpaceShortcut(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) return;
    if (video.paused || video.ended) void startPlayback();
    else {
      video.pause();
      showControls();
    }
  }, true);
  window.addEventListener("keyup", (event) => {
    if (!isSpaceShortcut(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  // Native sliders can retain keyboard focus inside the browser's controls.
  ["play", "pause", "seeked", "volumechange"].forEach((event) => {
    video.addEventListener(event, () => {
      if (dialog.open && document.activeElement === video) video.focus({ preventScroll: true });
    });
  });

  playButton.addEventListener("click", () => {
    dialog.showModal();
    document.documentElement.classList.add("has-sales-video-dialog");
    video.preload = "auto";
    video.focus({ preventScroll: true });
    void startPlayback();
  });

  closeButton.addEventListener("click", () => dialog.close());
  let pressedBackdrop = false;
  const isBackdrop = (event) => {
    if (event.target !== dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener("pointerdown", (event) => { pressedBackdrop = isBackdrop(event); });
  dialog.addEventListener("click", (event) => {
    if (pressedBackdrop && isBackdrop(event)) dialog.close();
    pressedBackdrop = false;
  });
  dialog.addEventListener("close", () => {
    video.pause();
    pointerDown = false;
    pressedBackdrop = false;
    showControls();
    document.documentElement.classList.remove("has-sales-video-dialog");
    playButton.focus({ preventScroll: true });
  });
});
