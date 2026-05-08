/**
 * Подставляет плейсхолдеры {KEY} из window.SITE_CONFIG в атрибуты, JSON-LD и [data-site].
 * Запускается при загрузке DOM (defer).
 */
(function () {
  'use strict';

  function sub(str) {
    if (str == null || !window.SITE_CONFIG) return str;
    return String(str).replace(/\{([A-Z0-9_]+)\}/g, function (_, k) {
      var v = window.SITE_CONFIG[k];
      return v != null ? String(v) : '{' + k + '}';
    });
  }

  function bindJsonLd() {
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
      var t = s.textContent;
      if (/\{[A-Z0-9_]+\}/.test(t)) {
        s.textContent = sub(t);
      }
    });
  }

  function bindTitle() {
    var titleEl = document.querySelector('title');
    if (titleEl && /\{[A-Z0-9_]+\}/.test(titleEl.textContent)) {
      var out = sub(titleEl.textContent);
      document.title = out;
      titleEl.textContent = out;
    }
  }

  function bindAttributes(root) {
    root.querySelectorAll('*').forEach(function (el) {
      if (el.tagName === 'SCRIPT') return;
      var attrs = el.attributes;
      for (var i = 0; i < attrs.length; i++) {
        var a = attrs[i];
        if (a.value && /\{[A-Z0-9_]+\}/.test(a.value)) {
          el.setAttribute(a.name, sub(a.value));
        }
      }
    });
  }

  function bindDataSite() {
    document.querySelectorAll('[data-site]').forEach(function (el) {
      var key = el.getAttribute('data-site');
      if (!key || el.hasAttribute('data-site-attr')) return;
      var v = window.SITE_CONFIG[key];
      if (v != null) el.textContent = String(v);
    });
    document.querySelectorAll('[data-site-tpl]').forEach(function (el) {
      var tpl = el.getAttribute('data-site-tpl');
      if (tpl == null) return;
      var attr = el.getAttribute('data-site-attr');
      var out = sub(tpl);
      if (attr) {
        el.setAttribute(attr, out);
      } else if (el.tagName === 'TITLE') {
        document.title = out;
      } else {
        el.textContent = out;
      }
    });
  }

  function run() {
    if (!window.SITE_CONFIG) return;
    bindJsonLd();
    bindTitle();
    bindAttributes(document);
    bindDataSite();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
