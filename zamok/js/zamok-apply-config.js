/**
 * Подстановка window.ZAMOK_SITE_CONFIG (js/config.js) в разметку главной страницы.
 */
(function () {
  "use strict";

  function cfg() {
    var g =
      typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : null;
    return g && g.ZAMOK_SITE_CONFIG ? g.ZAMOK_SITE_CONFIG : null;
  }

  function telHref(n) {
    return "tel:" + String(n || "").replace(/\s/g, "");
  }

  function reviewCountPhrase(c) {
    var bc = c.business;
    return String(bc.reviewCount) + (bc.reviewCountSuffix || "");
  }

  function weekdayAll() {
    return [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
  }

  function buildLocksmithLd(c) {
    var schema = c.schema || {};
    return {
      "@context": "https://schema.org",
      "@type": "Locksmith",
      "@id": c.brand.orgId || c.site.url.replace(/\/?$/, "/") + "#organization",
      name: c.brand.name,
      url: c.site.url.replace(/\/?$/, "/"),
      telephone: c.contact.phoneE164,
      email: c.contact.email,
      priceRange: c.business.priceRange,
      image: c.site.defaultImageUrl,
      description: schema.locksmithDescription,
      areaServed: schema.areaServed || [],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: weekdayAll(),
          opens: (schema.openingHours && schema.openingHours.opens) || "00:00",
          closes: (schema.openingHours && schema.openingHours.closes) || "23:59",
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: String(c.business.ratingValue),
        reviewCount: String(c.business.reviewCount),
      },
    };
  }

  function buildFaqLd(c) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (c.faq || []).map(function (o) {
        return {
          "@type": "Question",
          name: o.question,
          acceptedAnswer: { "@type": "Answer", text: o.answer },
        };
      }),
    };
  }

  function buildReviewsLd(c) {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: (c.reviewsCards || []).map(function (r, idx) {
        return {
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Review",
            author: { "@type": "Person", name: r.author },
            reviewBody: r.text,
            reviewRating: {
              "@type": "Rating",
              ratingValue: String(r.rating || "5"),
              bestRating: "5",
            },
          },
        };
      }),
    };
  }

  function writeLd(id, obj) {
    var el = document.getElementById(id);
    if (el && obj) el.textContent = JSON.stringify(obj);
  }

  function applyHead(c) {
    var s = c.seo || {};
    if (s.title) document.title = s.title;
    var m = function (sel, val) {
      if (val == null) return;
      var el = document.querySelector(sel);
      if (el) el.setAttribute("content", val);
    };
    m('meta[name="description"]', s.description);
    m('meta[name="keywords"]', s.keywords);
    m('meta[name="author"]', c.site && c.site.author);
    m('meta[property="og:url"]', c.site.url.replace(/\/?$/, "/"));
    m('meta[property="og:title"]', s.ogTitle);
    m('meta[property="og:description"]', s.ogDescription);
    m('meta[name="twitter:title"]', s.twitterTitle);
    m('meta[name="twitter:description"]', s.twitterDescription);
    var can = document.querySelector('link[rel="canonical"]');
    if (can) can.setAttribute("href", c.site.url.replace(/\/?$/, "/"));

    writeLd("zamok-ld-locksmith", buildLocksmithLd(c));
    writeLd("zamok-ld-faq", buildFaqLd(c));
    writeLd("zamok-ld-reviews", buildReviewsLd(c));
  }

  function applyTel(c, root) {
    root.querySelectorAll("a[data-zamok-link='tel']").forEach(function (a) {
      a.setAttribute("href", telHref(c.contact.phoneE164));
      if (!a.hasAttribute("data-zamok-preserve-inner")) {
        a.textContent = c.contact.phoneDisplay;
      }
    });
  }

  function applyMailto(c, root) {
    root.querySelectorAll("a[data-zamok-link='mailto']").forEach(function (a) {
      a.setAttribute("href", "mailto:" + c.contact.email);
      a.textContent = c.contact.email;
    });
  }

  function applyLogo(c, root) {
    var logo = c.brand.logoHtml || c.brand.name;
    root.querySelectorAll("[data-zamok-logo]").forEach(function (el) {
      el.innerHTML = logo;
    });
  }

  function applyMarquee(c, root) {
    var parts = (c.texts && c.texts.marquee) || [];
    if (!parts.length) return;
    root.querySelectorAll("[data-zamok-marquee]").forEach(function (wrap) {
      var sep = wrap.getAttribute("data-zamok-sep") || "·";
      function row() {
        var frag = document.createDocumentFragment();
        parts.forEach(function (p, i) {
          var s = document.createElement("span");
          s.textContent = p;
          frag.appendChild(s);
          if (i < parts.length - 1) {
            var dot = document.createElement("span");
            dot.textContent = sep;
            frag.appendChild(dot);
          }
        });
        return frag;
      }
      wrap.innerHTML = "";
      wrap.appendChild(row());
      wrap.appendChild(row());
    });
  }

  function applyPreloaderLetters(c, root) {
    var box = root.querySelector(".letters-loading-container");
    if (!box || !c.brand.name) return;
    var name = c.brand.name;
    var chars = name.match(/[\p{L}\p{N}]/gu);
    if (!chars || !chars.length) chars = name.replace(/[^A-Za-zА-Яа-яЁё0-9]/g, "").split("");
    box.innerHTML = "";
    chars.forEach(function (ch) {
      var sp = document.createElement("span");
      sp.className = "letters-loading";
      sp.setAttribute("data-text-preloader", ch);
      sp.textContent = ch;
      box.appendChild(sp);
    });
  }

  function applyFaq(c, root) {
    root.querySelectorAll("[data-zamok-faq-index]").forEach(function (fi) {
      var ix = parseInt(fi.getAttribute("data-zamok-faq-index"), 10);
      var item = (c.faq || [])[ix];
      if (!item) return;
      var qBtn = fi.querySelector(".faq-q span:first-child");
      var aDiv = fi.querySelector(".faq-a");
      var vh = aDiv && aDiv.querySelector(".visually-hidden");
      if (qBtn) qBtn.textContent = item.question;
      if (vh && item.answerHeading) vh.textContent = item.answerHeading;
      if (aDiv) {
        var kill = [];
        Array.from(aDiv.childNodes).forEach(function (n) {
          if (n.nodeType === 1 && n.classList && n.classList.contains("visually-hidden")) return;
          kill.push(n);
        });
        kill.forEach(function (n) {
          aDiv.removeChild(n);
        });
        var span = document.createElement("span");
        span.textContent = item.answer;
        aDiv.appendChild(span);
      }
    });
  }

  function applyReviews(c, root) {
    var cards = root.querySelectorAll("[data-zamok-review-cards] .card-review");
    (c.reviewsCards || []).forEach(function (r, idx) {
      if (!cards[idx]) return;
      var p = cards[idx].querySelector("p.mb-2");
      var cite = cards[idx].querySelector("cite");
      if (p) p.textContent = "«" + r.text + "».";
      if (cite) cite.textContent = r.author;
    });
    var qs = root.querySelectorAll("[data-zamok-review-quotes] .quote-cell");
    (c.reviewQuotes || []).forEach(function (q, idx) {
      if (!qs[idx]) return;
      qs[idx].textContent = "«" + q + "».";
    });
  }

  function applyStaticTexts(c, root) {
    var T = c.texts || {};
    var h = T.hero || {};
    var ab = T.about || {};

    function set(sel, val) {
      if (val == null) return;
      root.querySelectorAll(sel).forEach(function (el) {
        el.textContent = val;
      });
    }

    set("[data-zamok-text='offcanvas-lead']", T.offcanvasLead);
    set("[data-zamok-text='hero-h1']", h.h1);
    set("[data-zamok-text='hero-subtitle']", h.subtitle);
    set("[data-zamok-text='hero-lead']", h.lead);
    set("[data-zamok-text='hero-kpi-dispatch']", h.kpiDispatch);
    set("[data-zamok-text='hero-kpi-visits']", h.kpiVisits);
    set("[data-zamok-text='hero-kpi-transparent']", h.kpiTransparent);
    set("[data-zamok-text='hero-kpi-lab-dispatch']", h.kpiLabelDispatch);
    set("[data-zamok-text='hero-kpi-lab-visits']", h.kpiLabelVisits);
    set("[data-zamok-text='hero-kpi-lab-transparent']", h.kpiLabelTransparent);
    set("[data-zamok-text='hero-hotline-caption']", h.hotlineCaption);
    set("[data-zamok-text='hero-hotline-hint']", h.hotlineHint);

    set("[data-zamok-text='about-pill-visits']", ab.pillVisits);
    set("[data-zamok-text='about-pill-years']", ab.pillYears);
    set("[data-zamok-text='about-pill-official']", ab.pillOfficial);
    set("[data-zamok-text='about-pill-rating']", c.business.ratingPill);

    set("[data-zamok-text='about-fact-1']", ab.fact1);
    set("[data-zamok-text='about-fact-2']", ab.fact2);
    set("[data-zamok-text='about-fact-3']", ab.fact3);
    set("[data-zamok-text='about-fact-4']", ab.fact4);

    var b1 = root.querySelector("[data-zamok-html='about-body-1']");
    if (b1 && ab.body1Html) b1.innerHTML = ab.body1Html;
    var b2 = root.querySelector("[data-zamok-html='about-body-2']");
    if (b2 && ab.body2Html !== undefined) b2.textContent = ab.body2Html;

    set("[data-zamok-text='zones-msk']", ab.zoneMsk);
    set("[data-zamok-text='zones-spb']", ab.zoneSpb);

    set("[data-zamok-text='reviews-heading']", T.reviewsSectionTitle);
    set("[data-zamok-text='reviews-intro']", T.reviewsIntro);
    root.querySelectorAll("[data-zamok-text='reviews-bar-score']").forEach(function (el) {
      el.textContent = "★ " + c.business.ratingValue;
    });
    set(
      "[data-zamok-text='reviews-bar-count']",
      reviewCountPhrase(c) + " " + (T.reviewsSummarySuffix || "")
    );

    set("[data-zamok-text='review-summ-rating']", c.business.ratingValue);
    set("[data-zamok-text='review-summ-count']", reviewCountPhrase(c));
    set("[data-zamok-text='review-summ-years']", c.business.yearsOnAirShort);
    set("[data-zamok-text='review-summ-years-rest']", T.reviewSummaryYearsRest);

    set("[data-zamok-text='contact-lead']", T.contactLead);
    set("[data-zamok-text='form-success']", T.formSuccess);
    set("[data-zamok-text='footer-about']", T.footerAbout);
    set("[data-zamok-text='regions-line']", c.contact.regionsLine);

    set("[data-zamok-text='copyright-brand']", c.brand.name);
    set("[data-zamok-text='copyright-after']", T.copyrightAfterBrand);
  }

  function applyFab(c, root) {
    var fab = root.getElementById("zamok-float-call");
    if (!fab) return;
    fab.setAttribute("href", telHref(c.contact.phoneE164));
    if (c.contact.floatCallAriaLabel)
      fab.setAttribute("aria-label", c.contact.floatCallAriaLabel);
  }

  function runBody(c) {
    var root = document;
    applyLogo(c, root);
    applyStaticTexts(c, root);
    applyMarquee(c, root);
    applyFaq(c, root);
    applyReviews(c, root);
    applyPreloaderLetters(c, root);
    applyTel(c, root);
    applyMailto(c, root);
    applyFab(c, root);
  }

  function run(c) {
    applyHead(c);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        runBody(c);
      });
    } else {
      runBody(c);
    }
  }

  var z = cfg();
  if (z) run(z);
})();
