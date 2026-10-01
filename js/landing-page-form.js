(() => {
  const phoneLibrary = window.libphonenumber;
  if (!phoneLibrary) return;

  const countryNames = typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;
  const countries = phoneLibrary.getCountries().map((country) => ({
    country,
    name: countryNames?.of(country) || country,
    callingCode: phoneLibrary.getCountryCallingCode(country),
  })).sort((a, b) => {
    if (a.country === "AU") return -1;
    if (b.country === "AU") return 1;
    return a.name.localeCompare(b.name);
  });

  document.querySelectorAll('form[name="main landing page form"]').forEach((form) => {
    const phoneInput = form.querySelector('input[name="phone_number"]');
    const countrySelect = form.querySelector("[data-phone-country]");
    const countryText = form.querySelector(".brisbane-landing-form__phone-country-text");
    if (!phoneInput || !countrySelect || !countryText) return;

    countrySelect.replaceChildren(...countries.map(({ country, name, callingCode }) =>
      new Option(`${name} (+${callingCode})`, country, country === "AU", country === "AU"),
    ));

    const syncCountryText = () => {
      const callingCode = phoneLibrary.getCountryCallingCode(countrySelect.value);
      countryText.textContent = `${countrySelect.value} +${callingCode}`;
    };

    const parsePhone = () => phoneLibrary.parsePhoneNumberFromString(phoneInput.value, {
      defaultCountry: countrySelect.value,
      extract: false,
    });

    const syncPhone = (formatInput = false) => {
      const phone = parsePhone();
      const isPossible = phone?.isPossible() && !phone.ext && phone.country;
      phoneInput.setCustomValidity(phoneInput.value && !isPossible
        ? "Enter a complete phone number, including the area code."
        : "");

      if (isPossible) {
        // Pasted international numbers select their own country, without doubling the prefix.
        countrySelect.value = phone.country;
        if (formatInput) phoneInput.value = phone.nationalNumber;
      }
      syncCountryText();
      return isPossible ? phone : null;
    };

    phoneInput.addEventListener("input", () => syncPhone());
    phoneInput.addEventListener("change", () => syncPhone(true));
    countrySelect.addEventListener("change", () => syncPhone());
    form.addEventListener("reset", () => queueMicrotask(() => syncPhone()));
    form.addEventListener("submit", (event) => {
      syncPhone();
      if (!phoneInput.checkValidity()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        phoneInput.reportValidity();
      }
    }, { capture: true });

    // Covers both the existing AJAX FormData payload and its native POST fallback.
    form.addEventListener("formdata", (event) => {
      const phone = syncPhone();
      if (phone) event.formData.set("phone_number", phone.number);
    });

    countrySelect.parentElement.hidden = false;
    phoneInput.closest(".brisbane-landing-form__phone-field").classList.add("is-enhanced");
    syncPhone();
  });
})();

document.querySelectorAll('form[name="main landing page form"]').forEach((form) => {
  // Wrap long package labels while retaining the native select interaction.
  const packageSelect = form.querySelector('select[name="website_situation"]');
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
