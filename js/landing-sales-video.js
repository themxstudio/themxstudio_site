document.querySelectorAll("[data-sales-video]").forEach((player) => {
  const video = player.querySelector("video");
  const poster = player.querySelector(".brisbane-sales-video__poster");
  const playButton = player.querySelector(".brisbane-sales-video__play");
  const dialog = document.getElementById(playButton?.getAttribute("aria-controls"));
  const mount = dialog?.querySelector("[data-sales-video-mount]");
  const closeButton = dialog?.querySelector(".brisbane-sales-video__close");
  if (!video || !poster || !playButton || !mount || !closeButton || typeof dialog.showModal !== "function") return;

  // Keep one native player in the dialog and a still preview on the page.
  // Without JavaScript, the original inline video retains native controls.
  mount.append(video);
  poster.hidden = false;
  playButton.hidden = false;

  playButton.addEventListener("click", async () => {
    dialog.showModal();
    document.documentElement.classList.add("has-sales-video-dialog");
    if (video.ended) video.currentTime = 0;
    try {
      await video.play();
    } catch {
      // The native controls remain available if playback cannot start.
    }
  });

  closeButton.addEventListener("click", () => dialog.close());

  let pressedBackdrop = false;
  const isBackdrop = (event) => {
    if (event.target !== dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener("pointerdown", (event) => {
    pressedBackdrop = isBackdrop(event);
  });
  dialog.addEventListener("click", (event) => {
    if (pressedBackdrop && isBackdrop(event)) dialog.close();
    pressedBackdrop = false;
  });

  // Also handles Escape through the dialog's built-in cancel behaviour.
  dialog.addEventListener("close", () => {
    video.pause();
    document.documentElement.classList.remove("has-sales-video-dialog");
    playButton.focus({ preventScroll: true });
  });
});
