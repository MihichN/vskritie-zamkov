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
      yandexMetrikaId: "",
    },
  };

  function mergeConfig(base, override = {}) {
    return {
      ...base,
      ...override,
      brand: { ...base.brand, ...override.brand },
      contacts: { ...base.contacts, ...override.contacts },
      forms: { ...base.forms, ...override.forms },
      metrics: { ...base.metrics, ...override.metrics },
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

  function setupYandexMetrika(config) {
    const id = config.metrics.yandexMetrikaId;
    if (!id || window.ym) return;

    (function loadMetrika(m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function ymStub() {
          (m[i].a = m[i].a || []).push(arguments);
        };
      m[i].l = 1 * new Date();
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    window.ym(id, "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });

    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.addEventListener("click", () => window.ym?.(id, "reachGoal", "phone_click"));
    });
    document.querySelectorAll(".request-form").forEach((form) => {
      form.addEventListener("submit", () => window.ym?.(id, "reachGoal", "form_submit"));
    });
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
    window.addEventListener("resize", updateFloatingCall);
    updateFloatingCall();
    updateHeader();
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
    setupYandexMetrika(config);
    setupFloatingCall();
    setupFaq();
    setupCarousel();
    setupForms();
  });
})();
