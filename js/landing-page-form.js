document.querySelectorAll('form[name="main landing page form"]').forEach((form) => {
  const emailInput = form.querySelector('input[name="email"]');
  if (!emailInput) return;

  const syncEmail = () => {
    emailInput.value = emailInput.value.trim();
    emailInput.setCustomValidity(
      emailInput.validity.typeMismatch || emailInput.validity.patternMismatch
        ? "Enter a valid email address, for example name@example.com."
        : "",
    );
  };

  emailInput.addEventListener("input", syncEmail);
  emailInput.addEventListener("change", syncEmail);
  emailInput.addEventListener("blur", syncEmail);
  form.addEventListener("reset", () => queueMicrotask(syncEmail));
  form.addEventListener("submit", (event) => {
    syncEmail();
    if (!emailInput.checkValidity()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      emailInput.reportValidity();
    }
  }, { capture: true });
  syncEmail();
});

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
      // Full metadata checks the length for this number's prefix/type, too.
      const isValid = phone?.isValid() && !phone.ext && phone.country;
      const country = phone?.country || countrySelect.value;
      const countryName = countryNames?.of(country) || country;
      phoneInput.setCustomValidity(phoneInput.value && !isValid
        ? `Enter a valid phone number for ${countryName}, with the correct number of digits and area code.`
        : "");

      if (isValid) {
        // Pasted international numbers select their own country, without doubling the prefix.
        countrySelect.value = phone.country;
        if (formatInput) phoneInput.value = phone.nationalNumber;
      }
      syncCountryText();
      return isValid ? phone : null;
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
