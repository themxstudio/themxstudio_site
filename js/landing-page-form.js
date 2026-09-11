document.querySelectorAll('form[name="main landing page form"]').forEach((form) => {
  // Wrap long package labels while retaining the native select interaction.
  const packageSelect = form.querySelector('select[name="project"]');
  const packageText = form.querySelector(".brisbane-landing-form__package-text");
  if (!packageSelect || !packageText) return;

  const syncPackageText = () => {
    packageText.textContent = packageSelect.selectedOptions[0]?.textContent || "";
  };
  packageSelect.addEventListener("change", syncPackageText);
  form.addEventListener("reset", () => queueMicrotask(syncPackageText));
  syncPackageText();
  packageSelect.closest(".brisbane-landing-form__package-field")?.classList.add("is-enhanced");
});
