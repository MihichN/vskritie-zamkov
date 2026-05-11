/**
 * Яндекс.Метрика: загрузка только при выборе «Принять все» в баннере cookie (ключ site_cookie_pref_v1).
 * ID счётчика — YANDEX_METRIKA_ID в js/site-config.js
 */
(function () {
  'use strict';

  var C = window.SITE_CONFIG || {};
  var ID = parseInt(String(C.YANDEX_METRIKA_ID || '109151024'), 10);
  if (!(ID > 0)) ID = 109151024;

  var STORAGE_KEY = 'site_cookie_pref_v1';
  var loaded = false;

  function load() {
    if (loaded) return;
    loaded = true;
    var src = 'https://mc.yandex.ru/metrika/tag.js?id=' + ID;
    (function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          (m[i].a = m[i].a || []).push(arguments);
        };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) {
          return;
        }
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', src, 'ym');

    window.ym(ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  function allowed() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'all';
    } catch (e) {
      return false;
    }
  }

  function tryLoad() {
    if (allowed()) load();
  }

  document.addEventListener('site:cookie-preference', function (ev) {
    if (ev.detail && ev.detail.level === 'all') load();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryLoad);
  } else {
    tryLoad();
  }
})();
