import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const excludedDirectories = new Set([
  ".git",
  "node_modules",
  "apply",
  "websites-for-australian-businesses",
]);

const formFields = `
  <input type="hidden" name="form-name" value="main website form" />
  <input type="hidden" name="budget" value="1000" data-range-submit-value />
  <p style="display: none"><label>Don't fill this out <input name="bot-field" /></label></p>
  <h2 class="brisbane-smb-landing-page__slider-heading">What's your budget?</h2>
  <div class="brisbane-smb-landing-page__slider-row">
    <label class="visually-hidden" for="main-website-budget">Your budget</label>
    <div class="brisbane-smb-landing-page__slider-shell">
      <input class="brisbane-smb-landing-page__slider-input" id="main-website-budget" type="range" min="1000" max="7000" step="50" value="1000" data-slider-milestones="1750,3500,5500" data-range-submit-target="budget" />
      <div class="brisbane-smb-landing-page__slider-milestones" aria-hidden="true"><span class="brisbane-smb-landing-page__slider-milestone" style="--slider-stop: 0.25"></span><span class="brisbane-smb-landing-page__slider-milestone" style="--slider-stop: 0.5"></span><span class="brisbane-smb-landing-page__slider-milestone" style="--slider-stop: 0.75"></span></div>
    </div>
  </div>
  <div class="brisbane-smb-landing-page__slider-total"><output class="brisbane-smb-landing-page__slider-output" for="main-website-budget" data-range-output>$1,000</output></div>
  <div class="brisbane-smb-landing-page__slider-field-grid brisbane-smb-landing-page__slider-field-grid--modal">
    <label class="visually-hidden" for="main-website-name">Name</label><input class="brisbane-smb-landing-page__slider-field" id="main-website-name" type="text" name="name" placeholder="Name" autocomplete="name" required />
    <label class="visually-hidden" for="main-website-email">Email</label><input class="brisbane-smb-landing-page__slider-field" id="main-website-email" type="email" name="email" placeholder="Email" autocomplete="email" required />
    <label class="visually-hidden" for="main-website-business">Business name</label><input class="brisbane-smb-landing-page__slider-field" id="main-website-business" type="text" name="business" placeholder="Business Name" autocomplete="organization" />
    <label class="visually-hidden" for="main-website-project">How can we help?</label><textarea class="brisbane-smb-landing-page__slider-field brisbane-smb-landing-page__slider-field--message" id="main-website-project" name="project" placeholder="How can we help?" rows="1" required></textarea>
    <button type="submit" class="brisbane-smb-landing-page__slider-submit">Continue To Booking</button>
  </div>`;

const files = [];
const walk = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) await walk(join(directory, entry.name));
    } else if (entry.name.endsWith(".html")) {
      files.push(join(directory, entry.name));
    }
  }
};

await walk(root);

for (const file of files) {
  const html = await readFile(file, "utf8");
  const updated = html.replace(
    /<form\b([^>]*\bname="main website form"[^>]*)>[\s\S]*?<\/form>/g,
    (_, attributes) => {
      const sourceClasses = "class=\"brisbane-smb-landing-page__slider-form brisbane-smb-landing-page__slider-form--modal\"";
      const opening = /\bclass="[^"]*"/.test(attributes)
        ? attributes.replace(/\bclass="[^"]*"/, sourceClasses)
        : `${attributes} ${sourceClasses}`;
      return `<form${opening}>${formFields}\n</form>`;
    },
  );
  if (updated !== html) await writeFile(file, updated);
}
