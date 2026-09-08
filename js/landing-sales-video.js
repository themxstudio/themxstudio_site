document.querySelectorAll("[data-sales-video]").forEach((player) => {
  const video = player.querySelector("video");
  const poster = player.querySelector(".brisbane-sales-video__poster");
  const playButton = player.querySelector(".brisbane-sales-video__play");
  const dialog = document.getElementById(playButton?.getAttribute("aria-controls"));
  const mount = dialog?.querySelector("[data-sales-video-mount]");
  const closeButton = dialog?.querySelector(".brisbane-sales-video__close");
  if (!video || !poster || !playButton || !mount || !closeButton || typeof dialog.showModal !== "function") return;

  mount.append(video);
  // Keep the native controls mounted so the browser can fade them smoothly.
  video.controls = true;
  poster.hidden = false;
  playButton.hidden = false;

  const startPlayback = async () => {
    if (video.ended) video.currentTime = 0;
    try {
      await video.play();
    } catch {
      // Native controls remain available if playback cannot start.
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
    if (!isSpaceShortcut(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) return;
    if (video.paused || video.ended) void startPlayback();
    else video.pause();
  }, true);
  window.addEventListener("keyup", (event) => {
    if (!isSpaceShortcut(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  // Return focus from native sliders so Space still works after scrubbing.
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
    pressedBackdrop = false;
    document.documentElement.classList.remove("has-sales-video-dialog");
    playButton.focus({ preventScroll: true });
  });
});
