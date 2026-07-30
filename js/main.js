const dropdowns = Array.from(document.querySelectorAll(".nav__item--dropdown"));

(() => {
  const root = document.documentElement;
  if (!root) return;

  let syncFrame = null;

  const syncContentWidthCap = () => {
    syncFrame = null;

    const computed = window.getComputedStyle(root);
    const physicalWidth =
      Number.parseFloat(
        computed.getPropertyValue("--content-max-width-physical"),
      ) || 2800;
    const devicePixelRatio = Math.max(window.devicePixelRatio || 1, 1);
    const cssWidth = physicalWidth / devicePixelRatio;

    root.style.setProperty("--content-max-width", `${cssWidth}px`);
  };

  const queueContentWidthCapSync = () => {
    if (syncFrame) cancelAnimationFrame(syncFrame);
    syncFrame = requestAnimationFrame(syncContentWidthCap);
  };

  syncContentWidthCap();
  window.addEventListener("resize", queueContentWidthCapSync);
  window.visualViewport?.addEventListener("resize", queueContentWidthCapSync);
})();

(() => {
  const body = document.body;
  if (!body) return;
  if (body.classList.contains("home-page")) return;
  if (body.classList.contains("service-page")) return;
  if (document.querySelector('meta[http-equiv="refresh"]')) return;
  if (!document.querySelector(".site-header")) return;

  const normalizePath = (value) => {
    if (!value) return "/";
    const path = value
      .split("#")[0]
      .split("?")[0]
      .replace(/index\.html$/i, "");
    if (!path || path === "") return "/";
    return path.endsWith("/") ? path : `${path}/`;
  };

  const formatSlug = (value) => {
    const tokenMap = new Map([
      ["ai", "AI"],
      ["seo", "SEO"],
      ["ux", "UX"],
      ["ui", "UI"],
      ["ads", "Ads"],
      ["qld", "QLD"],
      ["efjy", "EFJY"],
    ]);

    return value
      .replace(/\.html$/i, "")
      .split("-")
      .filter(Boolean)
      .map((part) => {
        const lower = part.toLowerCase();
        if (tokenMap.has(lower)) return tokenMap.get(lower);
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  };

  const currentPath = normalizePath(window.location.pathname || "/");
  const rootPageNames = new Map([
    ["/about/", "About"],
    ["/apply/", "Apply"],
    ["/blog/", "Blog"],
    ["/contact/", "Contact"],
    ["/locations/", "Locations"],
    ["/pricing/", "Pricing"],
    ["/results/", "Results"],
    ["/terms/", "Terms & Conditions"],
    ["/404.html/", "Page Not Found"],
    ["/404/", "Page Not Found"],
  ]);

  const getTitlePrefix = () =>
    (document.title || "")
      .split("|")[0]
      .replace(/\s+/g, " ")
      .trim();

  const getPageName = (hero) => {
    if (rootPageNames.has(currentPath)) return rootPageNames.get(currentPath);

    const existingLabel = hero?.querySelector(
      ".locations-page__h1, .website-services__h1",
    );
    if (existingLabel?.textContent?.trim()) {
      return existingLabel.textContent.replace(/\s+/g, " ").trim();
    }

    const titlePrefix = getTitlePrefix();
    if (currentPath.startsWith("/results/") && titlePrefix) {
      return titlePrefix.replace(/\s+Case Study$/i, "").trim();
    }
    if (currentPath.startsWith("/blog/") && titlePrefix) {
      return titlePrefix;
    }

    const segments = currentPath.split("/").filter(Boolean);
    const lastSegment = segments.at(-1);
    if (lastSegment) return formatSlug(lastSegment);

    return titlePrefix || "Page";
  };

  const getCrumbLabel = (segment, index, segments, pageName) => {
    const normalized = segment.replace(/\.html$/i, "");
    if (index === segments.length - 1) return pageName;

    const mapped = rootPageNames.get(`/${normalized}/`);
    if (mapped) return mapped;

    return formatSlug(normalized);
  };

  const buildBreadcrumbs = (pageName) => {
    const nav = document.createElement("nav");
    nav.className = "page-hero__breadcrumbs";
    nav.setAttribute("aria-label", "Breadcrumb");

    const homeLink = document.createElement("a");
    homeLink.href = "/";
    homeLink.textContent = "Home";
    nav.append(homeLink);

    const isNotFound = currentPath === "/404.html/" || currentPath === "/404/";
    if (isNotFound) {
      const sep = document.createElement("span");
      sep.className = "page-hero__breadcrumb-sep";
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "/";
      const current = document.createElement("span");
      current.setAttribute("aria-current", "page");
      current.textContent = pageName;
      nav.append(sep, current);
      return nav;
    }

    const segments = currentPath.split("/").filter(Boolean);
    segments.forEach((segment, index) => {
      const sep = document.createElement("span");
      sep.className = "page-hero__breadcrumb-sep";
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "/";
      nav.append(sep);

      const label = getCrumbLabel(segment, index, segments, pageName);
      if (index === segments.length - 1) {
        const current = document.createElement("span");
        current.setAttribute("aria-current", "page");
        current.textContent = label;
        nav.append(current);
        return;
      }

      const link = document.createElement("a");
      link.href = `/${segments.slice(0, index + 1).join("/")}/`;
      link.textContent = label;
      nav.append(link);
    });

    return nav;
  };

  const ensureMain = () => {
    const existingMain = document.querySelector("main");
    if (existingMain) return existingMain;

    const footer = document.querySelector(".site-footer");
    if (!footer) return null;

    const main = document.createElement("main");
    footer.before(main);
    return main;
  };

  const main = ensureMain();
  if (!main) return;
  if (
    body.classList.contains("blog-index-page") &&
    main.querySelector(".blog-hero-section")
  ) {
    return;
  }
  if (
    body.classList.contains("thank-you-page") ||
    body.classList.contains("apply-page")
  ) {
    return;
  }

  let hero = main.querySelector(".page-hero:not(.website-services__hero)");
  const existingHeroTitleMarkup =
    hero?.querySelector(".page-hero__title")?.innerHTML?.trim() || "";
  const preserveBlogHeroExtras = body.classList.contains("blog-post-page");
  const existingBlogShare = preserveBlogHeroExtras
    ? hero?.querySelector(".blog-share")?.cloneNode(true)
    : null;
  const existingBlogSub = preserveBlogHeroExtras
    ? hero?.querySelector(".page-hero__sub")?.cloneNode(true)
    : null;
  if (!hero) {
    hero = document.createElement("section");
    hero.className = "page-hero page-hero--simple";
    const firstChild = main.firstElementChild;
    if (firstChild) main.insertBefore(hero, firstChild);
    else main.append(hero);
  }

  hero.classList.add("page-hero--simple");
  body.classList.add("has-simple-page-hero");

  const pageName = getPageName(hero);
  const heroTitleMarkup = existingHeroTitleMarkup || pageName;
  const heroId = `simple-page-hero-${pageName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  hero.setAttribute("aria-labelledby", heroId);
  hero.innerHTML = "";

  const content = document.createElement("div");
  content.className = "page-hero__content";

  const eyebrow = document.createElement("h1");
  eyebrow.className = "page-hero__eyebrow";
  eyebrow.id = heroId;
  eyebrow.textContent = pageName;

  const title = document.createElement("p");
  title.className = "page-hero__title page-hero__title--simple";
  title.innerHTML = heroTitleMarkup;

  content.append(buildBreadcrumbs(pageName), eyebrow, title);
  if (existingBlogShare) content.append(existingBlogShare);
  if (existingBlogSub) content.append(existingBlogSub);
  hero.append(content);
})();

(() => {
  const body = document.body;
  if (!body) return;
  if (body.classList.contains("home-page")) return;
  if (body.classList.contains("service-page")) return;

  const hero =
    document.querySelector("main > .page-hero--simple") ||
    document.querySelector("main .page-hero--simple");
  if (!hero) return;
  if (hero.parentElement?.classList.contains("page-hero-wrap--simple")) return;

  const wrap = document.createElement("div");
  wrap.className = "page-hero-wrap--simple";
  hero.before(wrap);
  wrap.append(hero);
})();

(() => {
  const normalizePath = (value) => {
    if (!value) return "/";
    const path = value
      .split("#")[0]
      .split("?")[0]
      .replace(/index\.html$/i, "");
    if (!path || path === "") return "/";
    return path.endsWith("/") ? path : `${path}/`;
  };

  const currentPath = normalizePath(window.location.pathname || "/");
  const links = document.querySelectorAll(
    [
      ".site-header__nav .nav__link[href]",
      ".site-header__nav .nav__menu-link[href]",
      ".site-header__actions-link[href]",
      ".mobile-panel .mobile-nav__link[href]",
      ".mobile-panel .nav__menu-link[href]",
    ].join(", "),
  );

  const isCurrentPath = (linkPath) =>
    linkPath === currentPath ||
    (linkPath !== "/" && currentPath.startsWith(linkPath));

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (!href.startsWith("/")) return;

    const linkPath = normalizePath(href);

    if (isCurrentPath(linkPath)) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  document
    .querySelectorAll(".site-header__nav .nav__item--dropdown")
    .forEach((dropdown) => {
      const trigger = dropdown.querySelector(".nav__trigger");
      const childLinks = Array.from(
        dropdown.querySelectorAll(".nav__menu-link[href]"),
      );

      if (!trigger) return;

      const hasCurrentChild = childLinks.some((link) => {
        const href = link.getAttribute("href");
        if (!href || !href.startsWith("/")) return false;
        return isCurrentPath(normalizePath(href));
      });

      if (hasCurrentChild) trigger.setAttribute("aria-current", "page");
      else trigger.removeAttribute("aria-current");
    });
})();

(() => {
  const body = document.body;
  if (!body?.classList.contains("service-page")) return;

  const normalizePath = (value) => {
    if (!value) return "/";
    const path = value
      .split("#")[0]
      .split("?")[0]
      .replace(/index\.html$/i, "");
    if (!path || path === "") return "/";
    return path.endsWith("/") ? path : `${path}/`;
  };

  const comparisonPointDescriptions = new Map([
    [
      "/services/web-design-brisbane/",
      [
        "CRM integrations, HubSpot embeds, and lead capture forms are built to feel native to the site.",
        "The words and hierarchy are shaped to make the offer clearer and easier to trust.",
        "The front end is built around your business, not forced into a generic template.",
        "Layouts are tuned for desktop, tablet, and mobile instead of shrinking awkwardly.",
        "Pages guide people toward enquiring, calling, or booking without guesswork.",
        "You can update key content without breaking the design or calling a developer.",
      ],
    ],
    [
      "/services/wordpress-web-design-brisbane/",
      [
        "Each page type is built around your offer, content, and conversion flow.",
        "The back end stays simple so day-to-day updates do not turn into a mess.",
        "The site, hosting, and logins stay in your control after handover.",
        "Templates are set up with headings, schema, and content hierarchy in mind.",
        "We keep the stack tight so the site stays faster and easier to maintain.",
        "Future edits and updates stay cleaner because the build starts cleaner.",
      ],
    ],
    [
      "/services/web-redesign-brisbane/",
      [
        "Old clutter gets stripped back so the important parts of the offer stand out.",
        "Pages get clearer sections, headings, and flow for people and search.",
        "Calls, forms, and next steps are easier to spot and easier to trust.",
        "Important rankings and URLs are reviewed before anything goes live.",
        "The refreshed site stays simpler to update once the rebuild is finished.",
        "The redesign fixes structural mess, not just the surface look.",
      ],
    ],
    [
      "/services/ecommerce-web-design-brisbane/",
      [
        "The store structure is organised so people can find the right item faster.",
        "The buying path is simplified to reduce drop-off and hesitation.",
        "Shopping feels smooth on phones, where a lot of store traffic actually comes from.",
        "Core commerce settings are configured properly so the store runs reliably.",
        "Categories, products, and internal links are set up to support search visibility.",
        "The whole storefront is built to feel clearer, faster, and less frustrating.",
      ],
    ],
    [
      "/services/brand-design-brisbane/",
      [
        "A mark built for your business, not something that feels borrowed or generic.",
        "Print-ready layouts keep the brand looking sharp in real-world touchpoints.",
        "Social assets stay consistent with the rest of the brand system.",
        "Colours are chosen and documented so the brand stays consistent everywhere.",
        "Type choices are defined clearly so future content still feels on-brand.",
        "You leave with usable files and rules, not just a pretty presentation.",
      ],
    ],
    [
      "/services/seo-brisbane/",
      [
        "We align pages to the queries people actually use when they are ready to act.",
        "Core pages are planned to target demand without bloating the site.",
        "Links help search engines and people move through the site more clearly.",
        "Titles, headings, copy, and structure are cleaned up where they are holding things back.",
        "The strategy covers standard search plus the signals newer answer engines rely on.",
        "Progress is measured against visibility and leads, not vanity charts alone.",
      ],
    ],
    [
      "/services/local-seo-brisbane/",
      [
        "Location pages are built around real service areas, not copied suburb filler.",
        "Profile signals are cleaned up so maps and local search work together better.",
        "The copy explains who you help and where, without sounding stuffed.",
        "Important service and location pages support each other instead of competing.",
        "Trust signals are placed where they help people feel more confident to enquire.",
        "The structure can expand into more suburbs without turning messy.",
      ],
    ],
    [
      "/services/ai-seo-brisbane/",
      [
        "Pages explain the offer more plainly so both people and machines can follow it.",
        "Important questions are handled directly instead of buried in fluff.",
        "The site makes it easier to understand who you are, what you do, and where you work.",
        "Related pages reinforce each other instead of sitting in isolation.",
        "The architecture stays easier to parse across search and answer engines.",
        "Reviews, proof, and business details are surfaced where they add clarity.",
      ],
    ],
    [
      "/services/seo-migration-brisbane/",
      [
        "Key pages and existing search value are mapped before the rebuild starts.",
        "Old URLs are pointed properly so traffic and authority are not thrown away.",
        "Important titles, descriptions, and SEO settings are retained where needed.",
        "Broken paths and weak connections are fixed as the new site goes live.",
        "We review crawlability, indexing, and core page signals before launch day.",
        "The rollout is watched closely so issues get caught early, not weeks later.",
      ],
    ],
    [
      "/services/google-ads-brisbane/",
      [
        "Campaigns are structured around real intent, not one messy catch-all bucket.",
        "The ad message and the page experience stay consistent from click to enquiry.",
        "Calls, forms, and real actions are measured so decisions are grounded in data.",
        "Messaging is iterated to improve quality, clarity, and click intent.",
        "Weak queries, placements, and spend leaks get trimmed back early.",
        "Paid search and organic pages support each other instead of pulling apart.",
      ],
    ],
    [
      "/services/web-hosting-and-maintenance-brisbane/",
      [
        "The site stays current so security and compatibility issues do not pile up.",
        "There is a safety net in place if something breaks or goes offline.",
        "Important enquiries and reporting are checked so the site keeps doing its job.",
        "Performance and reliability get watched, not ignored until there is a problem.",
        "Small issues get handled before they turn into bigger trust killers.",
        "The site stays looked after instead of being left to quietly decay.",
      ],
    ],
  ]);

  const descriptions = comparisonPointDescriptions.get(
    normalizePath(window.location.pathname || "/"),
  );
  if (!descriptions?.length) return;

  const points = Array.from(document.querySelectorAll(".comparison__point"));
  if (!points.length) return;

  points.forEach((point, index) => {
    const title = point.querySelector(".comparison__point-text");
    const description = descriptions[index];
    if (!title || !description) return;

    let copy = point.querySelector(".comparison__point-copy");
    if (!copy) {
      copy = document.createElement("div");
      copy.className = "comparison__point-copy";
      title.after(copy);
    }

    copy.prepend(title);

    let desc = copy.querySelector(".comparison__point-desc");
    if (!desc) {
      desc = document.createElement("p");
      desc.className = "comparison__point-desc";
      copy.append(desc);
    }

    desc.textContent = description;
  });
})();

if (dropdowns.length) {
  const closeDelayMs = 200;

  const closeDropdown = (dropdown, { blur = false } = {}) => {
    const trigger = dropdown.querySelector(".nav__trigger");
    const closeTimer = dropdown._closeTimer;
    if (closeTimer) clearTimeout(closeTimer);
    dropdown.classList.remove("is-open");
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      if (blur) trigger.blur();
    }
    dropdown._closeTimer = null;
  };

  const closeOthers = (activeDropdown) => {
    dropdowns.forEach((dropdown) => {
      if (dropdown !== activeDropdown) closeDropdown(dropdown);
    });
  };

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".nav__trigger");
    if (!trigger) return;
    const isClickableLink = trigger.matches("a[href]");

    const open = () => {
      const closeTimer = dropdown._closeTimer;
      if (closeTimer) clearTimeout(closeTimer);
      closeOthers(dropdown);
      dropdown.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      dropdown._closeTimer = null;
    };

    const scheduleClose = () => {
      const closeTimer = dropdown._closeTimer;
      if (closeTimer) clearTimeout(closeTimer);
      dropdown._closeTimer = setTimeout(() => {
        closeDropdown(dropdown);
      }, closeDelayMs);
    };

    dropdown.addEventListener("mouseenter", open);
    dropdown.addEventListener("mouseleave", scheduleClose);
    dropdown.addEventListener("focusin", open);
    dropdown.addEventListener("focusout", scheduleClose);

    if (!isClickableLink) {
      trigger.addEventListener("click", () => {
        const isOpen = dropdown.classList.contains("is-open");
        if (isOpen) closeDropdown(dropdown);
        else open();
      });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdowns.forEach((dropdown) => closeDropdown(dropdown, { blur: true }));
    }
  });
}

const burger = document.querySelector(".site-header__burger");
const mobilePanel = document.querySelector(".mobile-panel");
const mobileMenuHeader = burger?.closest(".site-header") || null;
const mobileOverlay = document.querySelector(".mobile-overlay");

if (mobileOverlay && mobileOverlay.parentElement !== document.body) {
  document.body.appendChild(mobileOverlay);
}

let scrollY = 0;
let menuCloseTimer = null;
const menuTransitionMs = 140;
const mobileUiAfterMenuClose = {
  active: false,
  anchorY: 0,
};

const armMobileUiAfterMenuClose = (
  y = window.scrollY || window.pageYOffset || 0,
) => {
  mobileUiAfterMenuClose.active = true;
  mobileUiAfterMenuClose.anchorY = y;
};

const shouldHoldMobileUiAfterMenuClose = (releaseThreshold = 4) => {
  if (!mobileUiAfterMenuClose.active) return false;
  const y = window.scrollY || window.pageYOffset || 0;
  if (y > mobileUiAfterMenuClose.anchorY + releaseThreshold) {
    mobileUiAfterMenuClose.active = false;
    return false;
  }
  return true;
};

const lockScroll = () => {
  scrollY = window.scrollY || window.pageYOffset || 0;
};

const syncMobilePanelHeight = () => {
  if (!burger || !mobilePanel) return;

  const headerWrap = burger.closest(".site-header__wrap");
  const anchorRect = headerWrap
    ? headerWrap.getBoundingClientRect()
    : burger.getBoundingClientRect();
  const viewportHeight =
    window.visualViewport?.height ||
    window.innerHeight ||
    document.documentElement.clientHeight ||
    0;
  const availableHeight = Math.max(
    160,
    Math.floor(viewportHeight - anchorRect.bottom),
  );

  mobilePanel.style.maxHeight = `${availableHeight}px`;
};

const unlockScroll = (afterUnlock) => {
  requestAnimationFrame(() => {
    afterUnlock?.();
  });
};

const openMenu = () => {
  if (!burger || !mobilePanel) return;
  if (menuCloseTimer) clearTimeout(menuCloseTimer);
  menuCloseTimer = null;
  mobileUiAfterMenuClose.active = false;

  mobileMenuHeader?.classList.remove(
    "is-gone",
    "is-hidden",
    "is-hidden-footer",
  );
  syncMobilePanelHeight();
  mobilePanel.scrollTop = 0;
  mobilePanel.hidden = false;
  mobilePanel.classList.add("is-open");
  if (mobileOverlay) {
    mobileOverlay.hidden = false;
    mobileOverlay.classList.add("is-open");
  }
  burger.setAttribute("aria-expanded", "true");
  lockScroll();
};

const closeMenu = () => {
  if (!burger || !mobilePanel) return;
  if (menuCloseTimer) clearTimeout(menuCloseTimer);

  mobilePanel.classList.remove("is-open");
  mobileOverlay?.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");

  menuCloseTimer = setTimeout(() => {
    menuCloseTimer = null;
    mobilePanel.hidden = true;
    mobilePanel.style.maxHeight = "";
    if (mobileOverlay) mobileOverlay.hidden = true;
    armMobileUiAfterMenuClose(scrollY);
    unlockScroll(() => {
      window.dispatchEvent(new CustomEvent("mobilepanelclosed"));
    });
  }, menuTransitionMs);
};

if (burger && mobilePanel) {
  burger.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = burger.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });

  document.addEventListener("click", (e) => {
    if (
      mobilePanel.classList.contains("is-open") &&
      !mobilePanel.contains(e.target) &&
      !burger.contains(e.target)
    ) {
      closeMenu();
    }
  });

  const preventOutsidePanelScroll = (event) => {
    if (burger.getAttribute("aria-expanded") !== "true") return;
    if (mobilePanel.contains(event.target)) return;
    event.preventDefault();
  };

  document.addEventListener("touchmove", preventOutsidePanelScroll, {
    passive: false,
  });
  document.addEventListener("wheel", preventOutsidePanelScroll, {
    passive: false,
  });

  window.addEventListener("resize", () => {
    if (burger.getAttribute("aria-expanded") !== "true") return;
    syncMobilePanelHeight();
  });

  window.visualViewport?.addEventListener("resize", () => {
    if (burger.getAttribute("aria-expanded") !== "true") return;
    syncMobilePanelHeight();
  });
}

document.querySelectorAll(".mobile-acc__trigger").forEach((btn) => {
  const panelId = btn.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!isOpen));
    panel.hidden = isOpen;
    panel.classList.toggle("is-open", !isOpen);

    if (isOpen) {
      panel
        .querySelectorAll(".mobile-acc__trigger[aria-expanded='true']")
        .forEach((t) => t.setAttribute("aria-expanded", "false"));
      panel.querySelectorAll(".mobile-acc__panel.is-open").forEach((p) => {
        p.classList.remove("is-open");
        p.hidden = true;
      });
    }
  });
});

(() => {
  const createCopyCaret = (prefix) => {
    const caret = document.createElement("span");
    caret.className = `${prefix}__caret`;
    caret.setAttribute("aria-hidden", "true");
    caret.innerHTML =
      '<svg viewBox="0 0 24 24" focusable="false"><path d="M8 5l8 7-8 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
    return caret;
  };

  const rebuildCopyTitle = (trigger, prefix) => {
    if (
      trigger.querySelector(`.${prefix}__trigger-text`) &&
      trigger.querySelector(`.${prefix}__trigger-tail`)
    ) {
      return;
    }

    const textWrap = document.createElement("span");
    textWrap.className = `${prefix}__trigger-text`;

    const tailWrap = document.createElement("span");
    tailWrap.className = `${prefix}__trigger-tail`;

    const nodes = Array.from(trigger.childNodes);
    if (!nodes.length) return;

    let splitIndex = -1;
    let tailNode = null;

    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      const node = nodes[index];
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) continue;
      splitIndex = index;
      tailNode = node;
      break;
    }

    if (!tailNode) return;

    nodes.slice(0, splitIndex).forEach((node) => {
      textWrap.appendChild(node);
    });

    if (tailNode.nodeType === Node.TEXT_NODE) {
      const raw = tailNode.textContent || "";
      const trimmed = raw.replace(/\s+$/, "");
      const lastSpace = trimmed.lastIndexOf(" ");

      if (lastSpace > -1) {
        const head = trimmed.slice(0, lastSpace + 1);
        const tail = trimmed.slice(lastSpace + 1);
        if (head) textWrap.appendChild(document.createTextNode(head));
        if (tail) tailWrap.appendChild(document.createTextNode(tail));
      } else if (trimmed) {
        tailWrap.appendChild(document.createTextNode(trimmed));
      }
    } else {
      tailWrap.appendChild(tailNode);
    }

    tailWrap.appendChild(createCopyCaret(prefix));
    trigger.replaceChildren();
    if (textWrap.childNodes.length) trigger.appendChild(textWrap);
    trigger.appendChild(tailWrap);
  };

  const initCopyAccordions = ({
    itemSelector,
    titleSelector,
    triggerSelector,
    panelSelector,
    prefix,
    startAllClosed = false,
    startAllOpen = false,
    mobileStartAllClosed = false,
    mobileStartFirstOpen = false,
    allowAllClosed = false,
    allowMultipleOpen = false,
  }) => {
    const items = Array.from(document.querySelectorAll(itemSelector)).filter(
      (item) => !item.closest('[data-copy-static="true"]')
    );
    if (!items.length) return;
    const mobileMq = mobileStartAllClosed || mobileStartFirstOpen
      ? window.matchMedia("(max-width: 767px)")
      : null;

    const getTrigger = (item) =>
      item.querySelector(triggerSelector) ||
      item.querySelector(`${titleSelector}[data-copy-trigger="true"]`);

    const getSiblings = (item) =>
      Array.from(item.parentElement?.querySelectorAll(itemSelector) || []);

    const isItemOpen = (item) => {
      const trigger = getTrigger(item);
      const panel = item.querySelector(panelSelector);
      if (!panel) return false;
      return trigger?.getAttribute("aria-expanded") === "true" || !panel.hidden;
    };

    const setOpen = (item, open) => {
      const trigger = getTrigger(item);
      const panel = item.querySelector(panelSelector);
      if (!trigger || !panel) return;
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      panel.hidden = !open;
    };

    items.forEach((item, index) => {
      const title = item.querySelector(titleSelector);
      const panel = item.querySelector(panelSelector);
      if (!title || !panel) return;

      if (!panel.id) panel.id = `${prefix}-panel-auto-${index + 1}`;

      let trigger = item.querySelector(triggerSelector);

      if (!trigger) {
        title.dataset.copyTrigger = "true";
        title.setAttribute("role", "button");
        title.setAttribute("tabindex", "0");
        title.setAttribute("aria-controls", panel.id);
        title.setAttribute("aria-expanded", "false");
        rebuildCopyTitle(title, prefix);
        trigger = title;
      } else {
        trigger.setAttribute("aria-controls", panel.id);
      }

      if (trigger.dataset.copyAccordionBound === "true") return;
      trigger.dataset.copyAccordionBound = "true";

      const toggle = (event) => {
        if (event.target instanceof Element && event.target.closest("a")) return;

        const isCurrentlyOpen = trigger.getAttribute("aria-expanded") === "true";
        const siblings = getSiblings(item);

        if (isCurrentlyOpen) {
          setOpen(item, false);
          if (
            !allowAllClosed &&
            !allowMultipleOpen &&
            !siblings.some((other) => isItemOpen(other)) &&
            siblings[0]
          ) {
            setOpen(siblings[0], true);
          }
          return;
        }

        if (!allowMultipleOpen) {
          siblings.forEach((other) => {
            if (other !== item) setOpen(other, false);
          });
        }
        setOpen(item, true);
      };

      trigger.addEventListener("click", toggle);

      if (trigger === title) {
        trigger.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          toggle(event);
        });
      }
    });

    const groups = new Map();
    items.forEach((item) => {
      const parent = item.parentElement;
      if (!parent) return;
      const group = groups.get(parent) || [];
      group.push(item);
      groups.set(parent, group);
    });

    const syncGroupState = () => {
      groups.forEach((group) => {
        if (!group.length) return;

        if (mobileMq?.matches) {
          if (mobileStartFirstOpen) {
            group.forEach((item, i) => setOpen(item, i === 0));
          } else {
            group.forEach((item) => setOpen(item, false));
          }
          return;
        }

        if (startAllOpen) {
          group.forEach((item) => {
            setOpen(item, true);
          });
          return;
        }

        if (startAllClosed) {
          group.forEach((item) => {
            setOpen(item, false);
          });
          return;
        }

        const activeItem = group.find((item) => isItemOpen(item)) || group[0];
        group.forEach((item) => {
          setOpen(item, item === activeItem);
        });
      });
    };

    syncGroupState();

    if (mobileMq) {
      const handleMobileStateChange = () => syncGroupState();
      if (typeof mobileMq.addEventListener === "function") {
        mobileMq.addEventListener("change", handleMobileStateChange);
      } else if (typeof mobileMq.addListener === "function") {
        mobileMq.addListener(handleMobileStateChange);
      }
    }
  };

  initCopyAccordions({
    itemSelector: ".intro-copy__item",
    titleSelector: ".intro-copy__title",
    triggerSelector: ".intro-copy__trigger",
    panelSelector: ".intro-copy__panel",
    prefix: "intro-copy",
  });

  initCopyAccordions({
    itemSelector: ".faq-two__item",
    titleSelector: ".faq-two__title",
    triggerSelector: ".faq-two__trigger",
    panelSelector: ".faq-two__panel",
    prefix: "faq-two",
    startAllOpen: true,
    mobileStartFirstOpen: true,
    allowAllClosed: true,
    allowMultipleOpen: true,
  });
})();

(() => {
  const lists = Array.from(document.querySelectorAll(".faq__list"));
  if (!lists.length) return;

  lists.forEach((list) => {
    const items = Array.from(list.querySelectorAll(".faq__item"));
    if (!items.length) return;

    items.forEach((item) => {
      item.open = false;
    });

    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (item.open) {
          items.forEach((other) => {
            if (other !== item) other.open = false;
          });
        }
      });
    });
  });
})();

(() => {
  const items = Array.from(document.querySelectorAll(".service-card"));
  if (!items.length) return;
  const groups = Array.from(document.querySelectorAll(".services-group"));

  const mobileMq = window.matchMedia("(max-width: 767px)");
  let heightSyncFrame = null;

  const setItemOpen = (item, open) => {
    const trigger = item.querySelector(".service-card__trigger");
    const panel = item.querySelector(".service-card__panel");
    if (!trigger || !panel) return;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
  };

  const syncHeights = () => {
    heightSyncFrame = null;

    groups.forEach((group) => {
      const cards = Array.from(group.querySelectorAll(".service-card"));
      if (!cards.length) return;

      cards.forEach((card) => {
        card.style.minHeight = "";
      });

      if (mobileMq.matches || cards.length < 2) return;

      const columns = new Set(
        cards.map((card) => Math.round(card.getBoundingClientRect().left)),
      );
      if (columns.size < 2) return;

      const maxHeight = Math.max(...cards.map((card) => card.offsetHeight));
      cards.forEach((card) => {
        card.style.minHeight = `${maxHeight}px`;
      });
    });
  };

  const queueHeightSync = () => {
    if (heightSyncFrame) cancelAnimationFrame(heightSyncFrame);
    heightSyncFrame = requestAnimationFrame(syncHeights);
  };

  const syncState = () => {
    if (mobileMq.matches) {
      items.forEach((item) => setItemOpen(item, false));
    } else {
      items.forEach((item) => setItemOpen(item, true));
    }

    queueHeightSync();
  };

  syncState();

  items.forEach((item) => {
    const trigger = item.querySelector(".service-card__trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      if (!mobileMq.matches) return;
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      items.forEach((other) => setItemOpen(other, false));
      if (!isOpen) setItemOpen(item, true);
      queueHeightSync();
    });
  });

  const handleChange = () => syncState();
  if (typeof mobileMq.addEventListener === "function") {
    mobileMq.addEventListener("change", handleChange);
  } else if (typeof mobileMq.addListener === "function") {
    mobileMq.addListener(handleChange);
  }

  window.addEventListener("resize", queueHeightSync);
  window.addEventListener("load", queueHeightSync);
  document.fonts?.ready?.then(queueHeightSync);
})();

const initLoopingCardCarousel = ({
  track,
  viewport,
  prev,
  next,
  items,
  doubleCardMq,
  singleCardMq,
}) => {
  if (!track || !viewport || !prev || !next || items.length < 2) {
    return () => {};
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const transitionMs = reducedMotion ? 1 : 280;
  const swipeThreshold = 36;
  const repeatCount = 3;
  const itemCount = items.length;

  let touchStartX = 0;
  let touchStartY = 0;
  let isTouchTracking = false;
  let firstVisibleIndex = itemCount;
  let isAnimating = false;
  let transitionFallback = null;

  const clearTransitionState = () => {
    if (!transitionFallback) return;
    clearTimeout(transitionFallback);
    transitionFallback = null;
  };

  const measureLayout = () => {
    const first = track.children[0];
    const second = track.children[1];
    if (!first) return null;

    const firstRect = first.getBoundingClientRect();
    const secondRect = second?.getBoundingClientRect() || null;
    const itemWidth = firstRect.width;
    const gap = secondRect ? secondRect.left - firstRect.left - itemWidth : 0;
    const step = itemWidth + gap;

    if (doubleCardMq?.matches) {
      const pairStartIndex = firstVisibleIndex + 1;
      const offset =
        viewport.clientWidth / 2 -
        (pairStartIndex * step + itemWidth + gap / 2);

      return { offset };
    }

    const middleVisibleIndex = firstVisibleIndex + 2;
    const offset =
      viewport.clientWidth / 2 -
      (middleVisibleIndex * step + itemWidth / 2);

    return { offset };
  };

  const syncVisibleState = () => {
    Array.from(track.children).forEach((item) => {
      item.classList.remove("is-edge-visible");
      item.classList.remove("is-mobile-current");
      item.classList.remove("is-tablet-current");
    });

    if (singleCardMq.matches) {
      track.children[firstVisibleIndex + 2]?.classList.add("is-mobile-current");
      return;
    }

    if (doubleCardMq?.matches) {
      track.children[firstVisibleIndex + 1]?.classList.add("is-tablet-current");
      track.children[firstVisibleIndex + 2]?.classList.add("is-tablet-current");
      return;
    }

    track.children[firstVisibleIndex]?.classList.add("is-edge-visible");
    track.children[firstVisibleIndex + 4]?.classList.add("is-edge-visible");
  };

  const applyTransform = ({ animate }) => {
    const layout = measureLayout();
    if (!layout) return;
    track.style.transition = animate
      ? `transform ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : "none";
    track.style.transform = `translate3d(${layout.offset}px, 0, 0)`;
  };

  const buildTrack = () => {
    track.innerHTML = "";
    for (let copy = 0; copy < repeatCount; copy += 1) {
      items.forEach((item) => {
        track.appendChild(item.cloneNode(true));
      });
    }
  };

  const finalizeMove = () => {
    if (!isAnimating) return;
    clearTransitionState();
    isAnimating = false;

    if (firstVisibleIndex <= 0) firstVisibleIndex += itemCount;
    else if (firstVisibleIndex >= itemCount * 2) firstVisibleIndex -= itemCount;

    syncVisibleState();
    applyTransform({ animate: false });
  };

  const move = (direction) => {
    if (isAnimating) return;
    isAnimating = true;
    clearTransitionState();
    firstVisibleIndex += direction;
    syncVisibleState();
    applyTransform({ animate: true });

    transitionFallback = window.setTimeout(finalizeMove, transitionMs + 40);
  };

  const handleTransitionEnd = (event) => {
    if (event.target !== track || event.propertyName !== "transform") return;
    finalizeMove();
  };

  const handlePrevClick = () => move(-1);
  const handleNextClick = () => move(1);

  const handleTouchStart = (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    isTouchTracking = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  };

  const handleTouchEnd = (event) => {
    if (!isTouchTracking) return;
    isTouchTracking = false;

    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) < swipeThreshold) return;
    if (Math.abs(dx) <= Math.abs(dy) * 1.15) return;

    move(dx < 0 ? 1 : -1);
  };

  const handleTouchCancel = () => {
    isTouchTracking = false;
  };

  const handleResize = () => {
    clearTransitionState();
    isAnimating = false;
    syncVisibleState();
    applyTransform({ animate: false });
  };

  track.addEventListener("transitionend", handleTransitionEnd);
  prev.addEventListener("click", handlePrevClick);
  next.addEventListener("click", handleNextClick);
  viewport.addEventListener("touchstart", handleTouchStart, {
    passive: true,
  });
  viewport.addEventListener("touchend", handleTouchEnd, {
    passive: true,
  });
  viewport.addEventListener("touchcancel", handleTouchCancel, {
    passive: true,
  });
  window.addEventListener("resize", handleResize);

  buildTrack();
  syncVisibleState();
  applyTransform({ animate: false });

  return () => {
    clearTransitionState();
    isTouchTracking = false;
    isAnimating = false;
    track.removeEventListener("transitionend", handleTransitionEnd);
    prev.removeEventListener("click", handlePrevClick);
    next.removeEventListener("click", handleNextClick);
    viewport.removeEventListener("touchstart", handleTouchStart);
    viewport.removeEventListener("touchend", handleTouchEnd);
    viewport.removeEventListener("touchcancel", handleTouchCancel);
    window.removeEventListener("resize", handleResize);
    track.style.transition = "";
    track.style.transform = "";
  };
};


(() => {
  const sections = Array.from(document.querySelectorAll(".reviews"));
  if (!sections.length) return;

  const singleCardMq = window.matchMedia("(max-width: 767px)");
  const doubleCardMq = window.matchMedia(
    "(min-width: 768px) and (max-width: 1200px)",
  );

  sections.forEach((section) => {
    const track = section.querySelector(".reviews__track");
    const viewport = section.querySelector(".reviews__viewport");
    const originalItems = Array.from(
      track?.querySelectorAll(".reviews__item") || [],
    );
    const prev = section.querySelector(
      '.reviews__arrow[data-direction="prev"]',
    );
    const next = section.querySelector(
      '.reviews__arrow[data-direction="next"]',
    );
    if (!track || !viewport || originalItems.length < 2 || !prev || !next)
      return;

    initLoopingCardCarousel({
      track,
      viewport,
      prev,
      next,
      items: originalItems.map((item) => item.cloneNode(true)),
      doubleCardMq,
      singleCardMq,
    });
  });
})();

(() => {
  const sections = Array.from(document.querySelectorAll(".portfolio-carousel"));
  if (!sections.length) return;

  const desiredProjects = [
    {
      filename: "metro-rags.webp",
      src: "/assets/images/metro-rags.webp",
      alt: "Metro Rags website project preview",
    },
    {
      filename: "everything-just-for-you.webp",
      src: "/assets/images/everything-just-for-you.webp",
      alt: "Everything Just For You website project preview",
    },
    {
      filename: "meridian-camera.webp",
      src: "/assets/images/meridian-camera.webp",
      alt: "Meridian Camera website project preview",
    },
    {
      filename: "animo-studio.webp",
      src: "/assets/images/animo-studio.webp",
      alt: "Animo Studio website project preview",
    },
    {
      filename: "still-waters.webp",
      src: "/assets/images/still-waters.webp",
      alt: "Still Waters website project preview",
    },
  ];

  const neutralizePortfolioCard = (item) => {
    const link = item.querySelector(".portfolio-carousel__link");
    if (!link) return item;

    const card = document.createElement("div");
    card.className = "portfolio-carousel__card";

    while (link.firstChild) {
      card.appendChild(link.firstChild);
    }

    link.replaceWith(card);
    card.querySelector(".portfolio-carousel__overlay")?.remove();
    return item;
  };

  const createPortfolioItem = (project) => {
    const item = document.createElement("article");
    item.className = "portfolio-carousel__item";

    const card = document.createElement("div");
    card.className = "portfolio-carousel__card";

    const image = document.createElement("img");
    image.className = "portfolio-carousel__image";
    image.src = project.src;
    image.alt = project.alt;
    image.width = 2400;
    image.height = 2300;
    image.loading = "lazy";
    image.decoding = "async";

    card.append(image);
    item.append(card);
    return item;
  };

  sections.forEach((section) => {
    const track = section.querySelector(".portfolio-carousel__track");
    const viewport = section.querySelector(".portfolio-carousel__viewport");
    const sourceItems = Array.from(
      track?.querySelectorAll(".portfolio-carousel__item") || [],
    );
    const prev = section.querySelector(
      '.portfolio-carousel__arrow[data-direction="prev"]',
    );
    const next = section.querySelector(
      '.portfolio-carousel__arrow[data-direction="next"]',
    );
    if (!track || !viewport || !prev || !next) return;

    sourceItems.forEach((item) => {
      neutralizePortfolioCard(item);
    });

    const ctaWrap = section.querySelector(".portfolio-cta-wrap");
    const primaryCta = ctaWrap?.querySelector(
      ".portfolio-cta:not(.portfolio-cta--secondary)",
    );
    if (primaryCta) {
      primaryCta.textContent = "I'm Ready";
    }

    if (ctaWrap && !ctaWrap.querySelector(".portfolio-cta--secondary")) {
      const secondaryCta = document.createElement("a");
      secondaryCta.className = "portfolio-cta portfolio-cta--secondary";
      secondaryCta.href = "/results/";
      secondaryCta.textContent = "See Our Work";
      ctaWrap.appendChild(secondaryCta);
    }

    const itemsByFilename = new Map(
      sourceItems.map((item) => {
        const src =
          item
            .querySelector(".portfolio-carousel__image")
            ?.getAttribute("src")
            ?.split("/")
            .pop() || "";
        return [src, item.cloneNode(true)];
      }),
    );
    const items = desiredProjects.map(
      (project) =>
        itemsByFilename.get(project.filename) || createPortfolioItem(project),
    );

    initLoopingCardCarousel({
      track,
      viewport,
      prev,
      next,
      items,
      doubleCardMq: window.matchMedia(
        "(min-width: 768px) and (max-width: 1200px)",
      ),
      singleCardMq: window.matchMedia("(max-width: 767px)"),
    });
  });
})();

(() => {
  const sections = Array.from(document.querySelectorAll(".blog-carousel"));
  if (!sections.length) return;

  const singleCardMq = window.matchMedia("(max-width: 767px)");
  const doubleCardMq = window.matchMedia(
    "(min-width: 768px) and (max-width: 1200px)",
  );

  sections.forEach((section) => {
    const track = section.querySelector(".blog-carousel__track");
    const viewport = section.querySelector(".blog-carousel__viewport");
    const originalItems = Array.from(
      track?.querySelectorAll(".blog-carousel__item") || [],
    );
    const prev = section.querySelector(
      '.blog-carousel__arrow[data-direction="prev"]',
    );
    const next = section.querySelector(
      '.blog-carousel__arrow[data-direction="next"]',
    );
    if (!track || !viewport || originalItems.length < 2 || !prev || !next)
      return;

    initLoopingCardCarousel({
      track,
      viewport,
      prev,
      next,
      items: originalItems.map((item) => item.cloneNode(true)),
      doubleCardMq,
      singleCardMq,
    });
  });
})();

(() => {
  const sections = Array.from(
    document.querySelectorAll(".about-instagram--home-carousel"),
  );
  if (!sections.length) return;

  const mobileCarouselMq = window.matchMedia("(max-width: 1024px)");
  const activeClass = "is-carousel-active";
  const states = new WeakMap();

  const restoreItems = (track, items) => {
    track.innerHTML = "";
    items.forEach((item) => {
      track.appendChild(item.cloneNode(true));
    });
  };

  const activate = (section) => {
    if (states.has(section)) return;

    const track = section.querySelector(".about-instagram__track");
    const viewport = section.querySelector(".about-instagram__viewport");
    const prev = section.querySelector(
      '.about-instagram__arrow[data-direction="prev"]',
    );
    const next = section.querySelector(
      '.about-instagram__arrow[data-direction="next"]',
    );
    const originalItems = Array.from(
      track?.querySelectorAll(".about-instagram__item") || [],
    ).map((item) => item.cloneNode(true));

    if (!track || !viewport || originalItems.length < 2 || !prev || !next) {
      return;
    }

    section.classList.add(activeClass);

    const destroyCarousel = initLoopingCardCarousel({
      track,
      viewport,
      prev,
      next,
      items: originalItems.map((item) => item.cloneNode(true)),
      singleCardMq: mobileCarouselMq,
    });

    states.set(section, {
      destroyCarousel,
      originalItems,
      track,
    });
  };

  const deactivate = (section) => {
    const state = states.get(section);
    if (!state) return;

    state.destroyCarousel();
    restoreItems(state.track, state.originalItems);
    section.classList.remove(activeClass);
    states.delete(section);
  };

  const sync = () => {
    sections.forEach((section) => {
      if (mobileCarouselMq.matches) {
        activate(section);
        return;
      }

      deactivate(section);
    });
  };

  sync();

  if (typeof mobileCarouselMq.addEventListener === "function") {
    mobileCarouselMq.addEventListener("change", sync);
  } else if (typeof mobileCarouselMq.addListener === "function") {
    mobileCarouselMq.addListener(sync);
  }
})();

(() => {
  const sections = Array.from(
    document.querySelectorAll(".blog-post-page .blog-share"),
  );
  if (!sections.length) return;

  const normalizeText = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  const stripSiteSuffix = (value) =>
    normalizeText(value).replace(/\s*\|\s*The MX Studio\s*$/i, "").trim();

  const getShareUrl = () => {
    const canonical = document
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href")
      ?.trim();

    if (canonical) return canonical;

    const { origin, pathname } = window.location;
    return `${origin}${pathname.endsWith("/") ? pathname : `${pathname}/`}`;
  };

  const getShareTitle = () => {
    const metaTitle =
      document.querySelector('meta[property="og:title"]')?.content ||
      document.querySelector('meta[name="twitter:title"]')?.content ||
      document.title ||
      document.querySelector(".page-hero__title")?.textContent ||
      "The MX Studio article";

    return (
      stripSiteSuffix(metaTitle) ||
      stripSiteSuffix(
        document.querySelector(".page-hero__title")?.textContent ||
          "The MX Studio article",
      )
    );
  };

  const copyToClipboard = async (value) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {}
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {}

    textarea.remove();
    return copied;
  };

  const buildShareHref = (platform, { title, url }) => {
    switch (platform) {
      case "x":
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
      case "threads":
        return `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`;
      case "linkedin":
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      case "instagram":
        return "https://www.instagram.com/";
      default:
        return url;
    }
  };

  sections.forEach((section) => {
    const shareUrl = getShareUrl();
    const shareTitle = getShareTitle();
    const copyButton = section.querySelector("[data-share-copy]");
    const copyLabel = section.querySelector("[data-share-copy-label]");
    const hint = section.querySelector("[data-share-hint]");
    const defaultLabel = normalizeText(
      copyLabel?.textContent || "Copy article link",
    );
    const defaultHint = normalizeText(hint?.textContent || "");
    let feedbackTimer = null;

    const resetFeedback = () => {
      if (copyButton) delete copyButton.dataset.state;
      if (copyLabel) copyLabel.textContent = defaultLabel;
      if (hint) hint.textContent = defaultHint;
    };

    const setFeedback = ({ state, labelText, hintText }) => {
      if (feedbackTimer) window.clearTimeout(feedbackTimer);

      if (copyButton && state) copyButton.dataset.state = state;
      if (copyLabel && labelText) copyLabel.textContent = labelText;
      if (hint && hintText) hint.textContent = hintText;

      if (!state) return;

      feedbackTimer = window.setTimeout(() => {
        resetFeedback();
      }, 2400);
    };

    copyButton?.addEventListener("click", async () => {
      const copied = await copyToClipboard(shareUrl);

      setFeedback({
        state: copied ? "copied" : "error",
        labelText: copied ? "Link copied" : "Copy link failed",
        hintText: copied
          ? "Article link copied. Paste it anywhere, including Instagram."
          : "Could not copy the link. Try again.",
      });
    });

    section.querySelectorAll("[data-share-platform]").forEach((link) => {
      const platform = link.dataset.sharePlatform;
      if (!platform) return;

      const href = buildShareHref(platform, {
        title: shareTitle,
        url: shareUrl,
      });
      link.href = href;

      if (platform !== "instagram") return;

      link.addEventListener("click", async (event) => {
        event.preventDefault();

        const copied = await copyToClipboard(shareUrl);
        window.open(href, "_blank", "noopener,noreferrer");

        setFeedback({
          state: copied ? "copied" : "error",
          labelText: copied ? "Link copied" : "Copy link failed",
          hintText: copied
            ? "Article link copied. Paste it into Instagram."
            : "Instagram opened. Copy the article link manually if needed.",
        });
      });
    });
  });
})();

const yearEl = document.getElementById("footer-year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const header = document.querySelector(".site-header");
const burgerBtn = document.querySelector(".site-header__burger");

if (header) {
  const show = () => {
    header.classList.remove("is-gone");
    header.classList.remove("is-hidden");
    header.classList.remove("is-hidden-footer");
  };

  window.addEventListener("mobilepanelclosed", () => {
    show();
  });
  show();
}

(() => {
  const fixedHeroes = Array.from(
    document.querySelectorAll(".page-hero .page-hero__content"),
  ).filter((el) => window.getComputedStyle(el).position === "fixed");
  if (!fixedHeroes.length) return;

  const sync = () => {
    const y = window.scrollY || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    fixedHeroes.forEach((el) => {
      const hero = el.closest(".page-hero");
      const rect = hero ? hero.getBoundingClientRect() : null;
      const bottomInset = rect
        ? Math.min(vh, Math.max(0, vh - rect.bottom))
        : 0;

      el.style.setProperty("--hero-scroll-offset", `${y}px`);
      el.style.clipPath = `inset(0 0 ${bottomInset}px 0)`;
      el.style.webkitClipPath = `inset(0 0 ${bottomInset}px 0)`;
    });
  };

  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync, { passive: true });
  sync();
})();

(() => {
  const titles = Array.from(document.querySelectorAll(".page-hero__title"));
  if (!titles.length) return;
  const ACCENT_START = "__PAGE_HERO_ACCENT_START__";
  const ACCENT_END = "__PAGE_HERO_ACCENT_END__";

  const readTextWithBreaks = (node) =>
    Array.from(node.childNodes)
      .map((child) => {
        if (child.nodeType === Node.TEXT_NODE) return child.textContent || "";
        if (child.nodeType !== Node.ELEMENT_NODE) return "";
        if (child.nodeName === "BR") return "\n";
        const content = readTextWithBreaks(child);
        if (!child.classList?.contains("accent")) return content;
        return `${ACCENT_START}${content}${ACCENT_END}`;
      })
      .join("");

  const normalizeLines = (value) =>
    value
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

  const buildReveal = (titleEl) => {
    if (titleEl.dataset.pageHeroTitleEnhanced === "true") return;

    const rawText = readTextWithBreaks(titleEl).trim();
    const lines = normalizeLines(
      rawText
        .replaceAll(ACCENT_START, ` ${ACCENT_START} `)
        .replaceAll(ACCENT_END, ` ${ACCENT_END} `),
    )
      .map((line) => {
        let accentActive = false;
        const words = [];

        line
          .split(" ")
          .filter(Boolean)
          .forEach((token) => {
            if (token === ACCENT_START) {
              accentActive = true;
              return;
            }

            if (token === ACCENT_END) {
              accentActive = false;
              return;
            }

            words.push({
              accent: accentActive,
              text: token,
            });
          });

        return words;
      })
      .filter((line) => line.length);
    if (!lines.length) return;

    const accessibleText = lines
      .map((line) => line.map(({ text }) => text).join(" "))
      .join(" ");
    const srText = document.createElement("span");
    srText.className = "visually-hidden";
    srText.textContent = accessibleText;

    const reveal = document.createElement("span");
    reveal.className = "page-hero__title-reveal";
    reveal.setAttribute("aria-hidden", "true");

    let charIndex = 0;

    lines.forEach((line, lineIndex) => {
      const lineEl = document.createElement("span");
      lineEl.className = "page-hero__title-line";

      line.forEach(({ accent, text }, wordIndex) => {
        const wordEl = document.createElement("span");
        wordEl.className = accent
          ? "page-hero__title-word page-hero__title-word--accent"
          : "page-hero__title-word";

        Array.from(text).forEach((char) => {
          const charEl = document.createElement("span");
          charEl.className = "page-hero__title-char";
          charEl.style.setProperty("--char-index", String(charIndex));
          charEl.textContent = char;
          wordEl.append(charEl);
          charIndex += 1;
        });

        lineEl.append(wordEl);

        if (wordIndex < line.length - 1) {
          lineEl.append(document.createTextNode(" "));
          charIndex += 1;
        }
      });

      reveal.append(lineEl);

      if (lineIndex < lines.length - 1) charIndex += 1;
    });

    titleEl.setAttribute("aria-label", accessibleText);
    titleEl.replaceChildren(srText, reveal);
    titleEl.dataset.pageHeroTitleEnhanced = "true";
  };

  titles.forEach(buildReveal);
})();

const parseCountToken = (raw) => {
  const text = String(raw || "").trim();
  const match = text.match(/^([^0-9-]*)(-?\d+(?:\.\d+)?)([^0-9]*)$/);
  if (!match) return null;

  const rawNumber = match[2];
  const integerPart = rawNumber.replace(/^-/, "").split(".")[0] || "0";

  return {
    prefix: match[1],
    target: Number.parseFloat(rawNumber),
    suffix: match[3],
    decimals: (rawNumber.split(".")[1] || "").length,
    minimumIntegerDigits:
      integerPart.startsWith("0") && integerPart.length > 1
        ? integerPart.length
        : 1,
  };
};

const formatCountValue = (token, value) => {
  const isNegative = value < 0;
  const fixed = Math.abs(value).toFixed(token.decimals);
  let [integerPart, fractionalPart] = fixed.split(".");

  integerPart = integerPart.padStart(token.minimumIntegerDigits, "0");

  const numberText = fractionalPart
    ? `${integerPart}.${fractionalPart}`
    : integerPart;

  return `${token.prefix}${isNegative ? "-" : ""}${numberText}${token.suffix}`;
};

const animateCountValue = (el, token, sharedDuration) => {
  const target = token.target;
  const stepSize = 10 ** token.decimals;
  const start = performance.now();

  const render = (value) => {
    el.textContent = formatCountValue(token, value);
  };

  const step = (now) => {
    const progress = Math.min(1, (now - start) / sharedDuration);
    const eased = 1 - (1 - progress) * (1 - progress);
    const value = Math.round(target * eased * stepSize) / stepSize;

    render(value);

    if (progress < 1) {
      requestAnimationFrame(step);
      return;
    }

    render(target);
  };

  render(0);
  requestAnimationFrame(step);
};

const lockCountWidth = (el, token) => {
  const probe = document.createElement("span");
  const styles = window.getComputedStyle(el);

  probe.textContent = formatCountValue(token, token.target);
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.whiteSpace = "nowrap";
  probe.style.fontFamily = styles.fontFamily;
  probe.style.fontSize = styles.fontSize;
  probe.style.fontWeight = styles.fontWeight;
  probe.style.fontStyle = styles.fontStyle;
  probe.style.letterSpacing = styles.letterSpacing;
  probe.style.lineHeight = styles.lineHeight;
  probe.style.fontVariantNumeric = styles.fontVariantNumeric;

  document.body.append(probe);
  const width = Math.ceil(probe.getBoundingClientRect().width);
  probe.remove();

  el.style.display = "inline-block";
  el.style.width = `${width}px`;
  el.style.whiteSpace = "nowrap";
};

const initCountGroup = ({
  elements,
  section,
  threshold = 0.45,
  rootMargin = "0px 0px -8% 0px",
}) => {
  if (!elements?.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const parsed = elements
    .map((el) => ({
      el,
      token: parseCountToken(el.dataset.countTo || el.textContent),
    }))
    .filter((item) => item.token);
  if (!parsed.length) return;

  let hasStarted = false;

  const start = () => {
    if (hasStarted) return;
    hasStarted = true;

    const run = () => {
      const maxTarget = Math.max(
        ...parsed.map((item) => Math.abs(item.token.target)),
        1,
      );
      const sharedDuration = Math.min(2400, Math.max(900, maxTarget * 30));

      parsed.forEach(({ el, token }) => {
        lockCountWidth(el, token);
        if (reducedMotion) {
          el.textContent = formatCountValue(token, token.target);
          return;
        }
        animateCountValue(el, token, sharedDuration);
      });
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(run, run);
      return;
    }

    run();
  };

  if (!("IntersectionObserver" in window) || !section) {
    start();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        start();
        observer.disconnect();
      });
    },
    {
      threshold: reducedMotion ? 0.2 : threshold,
      rootMargin,
    },
  );

  observer.observe(section);
};

(() => {
  const statsWrap = document.querySelector(".hero-stats");
  const statItems = Array.from(document.querySelectorAll(".hero-stats__item"));
  const statEls = Array.from(document.querySelectorAll(".hero-stats__figure"));
  if (!statsWrap || !statEls.length) return;
  const statsSection = statsWrap.closest(".hero-stats-section") || statsWrap;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  initCountGroup({ elements: statEls, section: statsSection });

  if (reducedMotion || !statItems.length) return;

  let lastY = window.scrollY || window.pageYOffset || 0;
  let rotation = 0;

  const setTilt = (value) => {
    statItems.forEach((item, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      item.style.setProperty(
        "--hero-stat-tilt",
        `${(value * direction).toFixed(2)}deg`,
      );
    });
  };

  const onScroll = () => {
    const nextY = window.scrollY || window.pageYOffset || 0;
    const deltaY = nextY - lastY;
    lastY = nextY;

    if (Math.abs(deltaY) < 0.5) return;

    rotation += deltaY * 0.35;
    setTilt(rotation);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
})();

(() => {
  const sections = Array.from(document.querySelectorAll(".customer-review"));
  if (!sections.length) return;

  sections.forEach((section) => {
    const statEls = Array.from(
      section.querySelectorAll(".customer-review__stat strong"),
    );

    initCountGroup({
      elements: statEls,
      section,
      threshold: 0.25,
      rootMargin: "0px 0px -12% 0px",
    });
  });
})();

(() => {
  const groups = Array.from(document.querySelectorAll("[data-count-group]"));
  if (!groups.length) return;

  groups.forEach((group) => {
    const elements = Array.from(group.querySelectorAll("[data-count-to]"));
    if (!elements.length) return;

    initCountGroup({
      elements,
      section: group,
      threshold: 0.3,
      rootMargin: "0px 0px -12% 0px",
    });
  });
})();

(() => {
  const section = document.querySelector(".photo-grid");
  const photo = document.querySelector(".photo-grid__image-wrap");
  if (!section || !photo) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let rafId = null;
  let currentX = 0;
  let targetX = 0;
  let animating = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smootherstep = (p) => p * p * p * (p * (p * 6 - 15) + 10);

  const computeTargets = () => {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!vh) return { x: 0 };

    // 0..1 while section passes through viewport.
    const travel = vh + rect.height;
    const t = clamp((vh - rect.top) / Math.max(1, travel), 0, 1);
    const smooth = smootherstep(t);
    const isNarrow = window.matchMedia("(max-width: 1366px)").matches;
    const radius = isNarrow
      ? clamp(section.clientWidth * 0.042, 18, 36)
      : clamp(section.clientWidth * 0.045, 30, 64);
    const wave = Math.sin(Math.PI * smooth); // 0 -> 1 -> 0 across section
    const x = radius * wave;

    return { x };
  };

  const apply = () => {
    photo.style.setProperty("--photo-scroll-x", `${currentX.toFixed(2)}px`);
  };

  const animate = () => {
    const dx = targetX - currentX;
    const lerp = 0.16;
    currentX += dx * lerp;

    if (Math.abs(dx) < 0.05) {
      currentX = targetX;
    }

    apply();

    if (Math.abs(targetX - currentX) >= 0.05) {
      rafId = requestAnimationFrame(animate);
      return;
    }

    animating = false;
    rafId = null;
  };

  const onScrollOrResize = () => {
    const target = computeTargets();
    targetX = target.x;
    if (animating) return;
    animating = true;
    rafId = requestAnimationFrame(animate);
  };

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  onScrollOrResize();
})();

(() => {
  const grid = document.querySelector(
    "body.home-page .section-accent-wrap .hero-points__grid",
  );
  const cards = grid
    ? Array.from(grid.querySelectorAll(":scope > .hero-points__item > .hero-points__card"))
    : [];
  if (!grid || cards.length < 2) return;

  const desktopMq = window.matchMedia("(min-width: 1367px)");
  let rafId = 0;

  const syncHeights = () => {
    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
      rafId = 0;

      cards.forEach((card) => {
        card.style.minHeight = "";
      });

      if (!desktopMq.matches) return;

      let tallest = 0;
      cards.forEach((card) => {
        const height = card.getBoundingClientRect().height;
        if (height > tallest) tallest = height;
      });

      if (!tallest) return;

      const nextHeight = `${Math.ceil(tallest)}px`;
      cards.forEach((card) => {
        card.style.minHeight = nextHeight;
      });
    });
  };

  const resizeObserver =
    "ResizeObserver" in window ? new ResizeObserver(syncHeights) : null;

  cards.forEach((card) => {
    resizeObserver?.observe(card);
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(syncHeights).catch(() => {});
  }

  if (typeof desktopMq.addEventListener === "function") {
    desktopMq.addEventListener("change", syncHeights);
  } else if (typeof desktopMq.addListener === "function") {
    desktopMq.addListener(syncHeights);
  }

  window.addEventListener("resize", syncHeights, { passive: true });
  syncHeights();
})();

(() => {
  const syncModalScrollLock = () => {
    document.documentElement.style.overflow = document.querySelector(
      ".form-modal.is-open",
    )
      ? "hidden"
      : "";
  };

  if (document.body?.classList.contains("blog-post-page")) {
    const rail = document.querySelector(".blog-article__rail");
    const sidebar = rail?.querySelector(".blog-sidebar-social");
    const contentForm = document.querySelector(
      ".blog-article__content > .blog-inline-form",
    );

    if (rail && sidebar && contentForm && !rail.querySelector(".blog-rail-form")) {
      const railForm = contentForm.cloneNode(true);
      railForm.classList.add("blog-rail-form");
      sidebar.insertAdjacentElement("afterend", railForm);
    }
  }

  const bindAsyncForm = ({ form, thanks, heading = null }) => {
    if (!form) return;

    const successUrl =
      form.dataset.successUrl?.trim() ||
      form.getAttribute("action")?.trim() ||
      "/thank-you/";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const body = new URLSearchParams(data).toString();

      try {
        const response = await fetch("/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });

        if (!response.ok)
          throw new Error(`Form submission failed: ${response.status}`);

        if (successUrl) {
          window.location.assign(successUrl);
          return;
        }

        form.hidden = true;
        if (heading) heading.hidden = true;
        if (thanks) thanks.hidden = false;
      } catch (error) {
        console.error(error);
      }
    });
  };

  const initFormModal = ({
    triggerSelector,
    modalId,
    closeId,
    formId,
    thanksId,
  }) => {
    const triggers = Array.from(document.querySelectorAll(triggerSelector));
    const modal = document.getElementById(modalId);
    const close = document.getElementById(closeId);
    const form = document.getElementById(formId);
    const thanks = document.getElementById(thanksId);
    const heading = modal?.querySelector(".form-modal__heading");
    if (!triggers.length) return;

    if (!modal) {
      triggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
          event.preventDefault();
          window.location.assign("/contact/");
        });
      });

      return;
    }

    const open = () => {
      modal.classList.add("is-open");
      syncModalScrollLock();
    };

    const resetState = () => {
      if (!form || !thanks) return;
      form.hidden = false;
      if (heading) heading.hidden = false;
      thanks.hidden = true;
      form.reset();
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      syncModalScrollLock();
      resetState();
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        open();
      });
    });

    close?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });

    bindAsyncForm({ form, thanks, heading });
  };

  initFormModal({
    triggerSelector: "[data-open-discovery]",
    modalId: "discovery-modal",
    closeId: "discovery-modal-close",
    formId: "discovery-form",
    thanksId: "discovery-thanks",
  });

  document.querySelectorAll("[data-inline-discovery-form]").forEach((form) => {
    const shell =
      form.closest(".blog-inline-form, .contact-inline-form, .contact-forms__card") ||
      form.parentElement;
    const thanks = shell?.querySelector("[data-inline-discovery-thanks]") || null;

    bindAsyncForm({ form, thanks });
  });
})();
