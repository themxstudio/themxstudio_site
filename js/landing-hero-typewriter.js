(() => {
  const title = document.querySelector(
    ".brisbane-smb-landing-page__title",
  );
  const fixedLine = title?.querySelector(
    ".brisbane-smb-landing-page__title-main",
  );
  const rotatingLine = title?.querySelector(
    ".brisbane-smb-landing-page__title-rotating",
  );
  if (!fixedLine || !rotatingLine) return;

  const fixedText = "WE BUILD HIGH QUALITY WEBSITES";
  const phrases = [
    "FOR SERVICE BUSINESSES",
    "FOR THERAPISTS",
    "FOR TRADIES",
    "FOR CLINICS",
    "FOR SMALL BUSINESSES",
  ];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) {
    fixedLine.textContent = fixedText;
    rotatingLine.textContent = phrases[0];
    return;
  }

  const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
  const type = async (element, value, delay) => {
    for (const character of value) {
      element.textContent += character;
      await wait(delay);
    }
  };
  const erase = async (element, delay) => {
    while (element.textContent) {
      element.textContent = element.textContent.slice(0, -1);
      await wait(delay);
    }
  };

  const run = async () => {
    title.classList.add("is-typewriter-active", "is-typing-first-line");
    fixedLine.textContent = "";
    rotatingLine.textContent = "";
    await type(fixedLine, fixedText, 18);
    title.classList.remove("is-typing-first-line");
    await wait(80);
    await type(rotatingLine, phrases[0], 22);

    for (let index = 1; ; index = (index + 1) % phrases.length) {
      await wait(1500);
      if (reducedMotion.matches) {
        title.classList.remove("is-typewriter-active");
        rotatingLine.textContent = phrases[0];
        return;
      }
      await erase(rotatingLine, 12);
      await wait(70);
      await type(rotatingLine, phrases[index], 22);
    }
  };

  run();
})();
