(function initSite() {
  const defaults = {
    brand: {
      name: "КЛЮЧНИК.РФ",
      legalName: "КЛЮЧНИК.РФ",
      domain: "https://klyuchnik.rf",
    },
    contacts: {
      phoneDisplay: "+7 999 000-00-00",
      phoneHref: "+79990000000",
      email: "info@klyuchnik.rf",
      telegramUrl: "",
      whatsappUrl: "",
      address: "",
      addresses: [],
    },
    forms: {
      formSubmitEmail: "info@klyuchnik.rf",
    },
    metrics: {
      yandexMetrikaId: "109151101",
    },
    legal: {
      operatorName: "",
      operatorInn: "",
      operatorAddress: "",
      pdContactEmail: "",
    },
  };

  const COOKIE_CONSENT_KEY = "klyuchnik_ru_cookie_consent_v1";

  function mergeConfig(base, override = {}) {
    return {
      ...base,
      ...override,
      brand: { ...base.brand, ...override.brand },
      contacts: { ...base.contacts, ...override.contacts },
      forms: { ...base.forms, ...override.forms },
      metrics: { ...base.metrics, ...override.metrics },
      legal: { ...base.legal, ...(override.legal || {}) },
    };
  }

  function getConfigUrl() {
    const currentScript = document.currentScript;
    if (!currentScript?.src) return "/js/config.js";

    return new URL("config.js", currentScript.src).href;
  }

  function loadConfig(callback) {
    if (window.SITE_CONFIG) {
      callback();
      return;
    }

    const script = document.createElement("script");
    script.src = getConfigUrl();
    script.onload = callback;
    script.onerror = callback;
    document.head.append(script);
  }

  function formatRussianPhone(value) {
    const digits = value.replace(/\D/g, "").replace(/^8/, "7").slice(0, 11);
    const normalized = digits.startsWith("7") ? digits : `7${digits}`;
    const parts = [
      normalized.slice(1, 4),
      normalized.slice(4, 7),
      normalized.slice(7, 9),
      normalized.slice(9, 11),
    ];

    let result = "+7";
    if (parts[0]) result += ` ${parts[0]}`;
    if (parts[1]) result += ` ${parts[1]}`;
    if (parts[2]) result += `-${parts[2]}`;
    if (parts[3]) result += `-${parts[3]}`;

    return result;
  }

  function updateJsonLdValue(value, config) {
    if (Array.isArray(value)) {
      return value.map((item) => updateJsonLdValue(item, config));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => {
          if (key === "telephone") return [key, config.contacts.phoneDisplay];
          if (key === "email") return [key, config.contacts.email];
          if (key === "name" && item === defaults.brand.name) return [key, config.brand.name];
          return [key, updateJsonLdValue(item, config)];
        }),
      );
    }

    return value;
  }

  function updateJsonLd(config) {
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        script.textContent = JSON.stringify(updateJsonLdValue(data, config), null, 2);
      } catch {
        // Keep invalid third-party JSON-LD untouched.
      }
    });
  }

  function updateContacts(config) {
    const { contacts } = config;
    const phoneHref = `tel:${contacts.phoneHref.replace(/[^\d+]/g, "")}`;
    const emailHref = `mailto:${contacts.email}`;

    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.href = phoneHref;
      if (link.classList.contains("phone-link") || link.closest(".contact-card") || link.closest(".site-footer")) {
        link.textContent = contacts.phoneDisplay;
      }
    });

    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      link.href = emailHref;
      link.textContent = contacts.email;
    });

    document.querySelectorAll(".request-form").forEach((form) => {
      if (config.forms.formSubmitEmail) {
        form.action = `https://formsubmit.co/${config.forms.formSubmitEmail}`;
      }
    });

    document.querySelectorAll(".contact-card span").forEach((container) => {
      const links = [];
      const addresses = [contacts.address, ...(contacts.addresses || [])].filter(Boolean);

      if (contacts.telegramUrl) links.push(`<a href="${contacts.telegramUrl}" target="_blank" rel="noopener">Telegram</a>`);
      if (contacts.whatsappUrl) links.push(`<a href="${contacts.whatsappUrl}" target="_blank" rel="noopener">WhatsApp</a>`);
      addresses.forEach((address) => links.push(`<span>${address}</span>`));

      if (links.length) {
        container.innerHTML = links.join("");
        container.classList.add("contact-links");
      }
    });

    updateJsonLd(config);
  }

  function getLegalPagesPrefix() {
    const link = document.querySelector('link[rel="stylesheet"][href*="style.css"]');
    const href = link?.getAttribute("href") || "";
    return href.startsWith("../") ? "../" : "";
  }

  function getPrivacyPolicyUrl() {
    return `${getLegalPagesPrefix()}politika-konfidencialnosti.html`;
  }

  function setupCookieSettingsLink() {
    document.querySelectorAll("[data-cookie-settings]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.removeItem(COOKIE_CONSENT_KEY);
        window.location.reload();
      });
    });
  }

  function renderCookieBanner(config) {
    if (document.querySelector("[data-cookie-consent-root]")) return;

    const policyUrl = getPrivacyPolicyUrl();
    const root = document.createElement("div");
    root.className = "cookie-consent";
    root.setAttribute("data-cookie-consent-root", "");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Согласие на использование cookies");
    root.innerHTML = `
      <div class="cookie-consent__panel">
        <p>
          Мы используем cookies и при вашем согласии можем подключать инструменты веб-аналитики (например, Яндекс.Метрику)
          для улучшения работы сайта. Технически необходимые cookies могут применяться без дополнительного согласия.
          Подробности — в <a href="${policyUrl}">политике конфиденциальности</a>.
        </p>
        <div class="cookie-consent__actions">
          <button type="button" class="button button-primary" data-cookie-accept-all>Принять все</button>
          <button type="button" class="button button-secondary" data-cookie-essential>Только необходимые</button>
          <a class="cookie-consent__link" href="${policyUrl}">Политика конфиденциальности</a>
        </div>
      </div>
    `;
    document.body.append(root);
    window.requestAnimationFrame(() => root.classList.add("is-visible"));

    function closeBanner() {
      root.classList.remove("is-visible");
      window.setTimeout(() => root.remove(), 280);
    }

    root.querySelector("[data-cookie-accept-all]")?.addEventListener("click", () => {
      localStorage.setItem(COOKIE_CONSENT_KEY, "all");
      closeBanner();
      setupYandexMetrika(config);
    });

    root.querySelector("[data-cookie-essential]")?.addEventListener("click", () => {
      localStorage.setItem(COOKIE_CONSENT_KEY, "essential");
      closeBanner();
    });
  }

  function setupCookieConsent(config) {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === "all") {
      setupYandexMetrika(config);
      return;
    }
    if (stored === "essential") {
      return;
    }
    renderCookieBanner(config);
  }

  function setupYandexMetrika(config) {
    const rawId = config.metrics.yandexMetrikaId;
    const id = typeof rawId === "string" ? parseInt(rawId, 10) : rawId;
    if (!id || Number.isNaN(id) || window.ym) return;

    const scriptSrc = `https://mc.yandex.ru/metrika/tag.js?id=${id}`;

    (function loadMetrika(m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function ymStub() {
          (m[i].a = m[i].a || []).push(arguments);
        };
      m[i].l = 1 * new Date();
      for (let j = 0; j < document.scripts.length; j += 1) {
        if (document.scripts[j].src === r) return;
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", scriptSrc, "ym");

    window.dataLayer = window.dataLayer || [];

    window.ym(id, "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true,
    });

    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.addEventListener("click", () => window.ym?.(id, "reachGoal", "phone_click"));
    });
    document.querySelectorAll(".request-form").forEach((form) => {
      form.addEventListener("submit", () => window.ym?.(id, "reachGoal", "form_submit"));
    });
  }

  function setHeaderOffset() {
    document.querySelectorAll("[data-header]").forEach((header) => {
      header.style.setProperty("--header-offset", `${header.offsetHeight}px`);
    });
  }

  function setupMobileNav() {
    const headers = document.querySelectorAll("[data-header]");
    if (!headers.length) return;

    function closeAll() {
      headers.forEach((header) => {
        header.classList.remove("is-nav-open");
        const btn = header.querySelector("[data-nav-toggle]");
        if (btn) {
          btn.setAttribute("aria-expanded", "false");
          btn.setAttribute("aria-label", "Открыть меню");
        }
        const backdrop = header.querySelector("[data-nav-backdrop]");
        if (backdrop) backdrop.setAttribute("aria-hidden", "true");
      });
      document.body.classList.remove("is-nav-open");
    }

    function toggleHeader(header) {
      const willOpen = !header.classList.contains("is-nav-open");
      closeAll();
      if (willOpen) {
        header.classList.add("is-nav-open");
        document.body.classList.add("is-nav-open");
        const btn = header.querySelector("[data-nav-toggle]");
        if (btn) {
          btn.setAttribute("aria-expanded", "true");
          btn.setAttribute("aria-label", "Закрыть меню");
        }
        const backdrop = header.querySelector("[data-nav-backdrop]");
        if (backdrop) backdrop.setAttribute("aria-hidden", "false");
      }
      setHeaderOffset();
    }

    headers.forEach((header) => {
      const btn = header.querySelector("[data-nav-toggle]");
      const backdrop = header.querySelector("[data-nav-backdrop]");
      const panel = header.querySelector("[data-nav-panel]");

      btn?.addEventListener("click", () => toggleHeader(header));
      backdrop?.addEventListener("click", closeAll);

      panel?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeAll);
      });
    });

    window.addEventListener("resize", () => {
      setHeaderOffset();
      if (window.innerWidth >= 768) closeAll();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAll();
    });

    setHeaderOffset();
  }

  function setupFloatingCall() {
    const floatingCall = document.querySelector("[data-floating-call]");
    const requestSection = document.querySelector("[data-request-section]");
    const header = document.querySelector("[data-header]");

    function updateFloatingCall() {
      if (!floatingCall) return;

      const scrolledEnough = window.scrollY > 300;
      let requestVisible = false;

      if (requestSection) {
        const rect = requestSection.getBoundingClientRect();
        requestVisible = rect.top < window.innerHeight * 0.72 && rect.bottom > 120;
      }

      floatingCall.classList.toggle("is-visible", scrolledEnough && !requestVisible);
    }

    function updateHeader() {
      if (!header) return;
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    }

    window.addEventListener("scroll", () => {
      updateFloatingCall();
      updateHeader();
    });
    window.addEventListener("resize", () => {
      updateFloatingCall();
      setHeaderOffset();
    });
    updateFloatingCall();
    updateHeader();
    setHeaderOffset();
  }

  function setupFaq() {
    document.querySelectorAll("[data-faq] .faq-item button").forEach((button) => {
      button.addEventListener("click", () => {
        const panel = button.nextElementSibling;
        const isExpanded = button.getAttribute("aria-expanded") === "true";

        button.setAttribute("aria-expanded", String(!isExpanded));
        if (panel) {
          panel.hidden = isExpanded;
        }
      });
    });
  }

  function setupCarousel() {
    const carousel = document.querySelector("[data-carousel]");
    if (!carousel) return;

    const cards = Array.from(carousel.querySelectorAll(".review-card"));
    const prevButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    let activeIndex = 0;

    function showReview(index) {
      activeIndex = (index + cards.length) % cards.length;
      cards.forEach((card, cardIndex) => {
        card.classList.toggle("is-active", cardIndex === activeIndex);
      });
    }

    prevButton?.addEventListener("click", () => showReview(activeIndex - 1));
    nextButton?.addEventListener("click", () => showReview(activeIndex + 1));
    window.setInterval(() => showReview(activeIndex + 1), 7000);
  }

  function setupForms() {
    document.querySelectorAll("[data-phone-input]").forEach((input) => {
      input.addEventListener("input", (event) => {
        event.target.value = formatRussianPhone(event.target.value);
      });
    });

    document.querySelectorAll("[data-form]").forEach((form) => {
      form.addEventListener("submit", () => {
        const formNote = form.querySelector("[data-form-note]");
        if (!formNote) return;

        formNote.textContent = "Заявка отправляется. Если форма еще не подключена к почте, замените email в js/config.js.";
        formNote.classList.add("is-success");
      });
    });
  }

  loadConfig(() => {
    const config = mergeConfig(defaults, window.SITE_CONFIG);
    updateContacts(config);
    setupCookieConsent(config);
    setupCookieSettingsLink();
    setupMobileNav();
    setupFloatingCall();
    setupFaq();
    setupCarousel();
    setupForms();
  });
})();
