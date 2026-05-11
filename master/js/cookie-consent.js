/**
 * Баннер согласия на использование cookie (ФЗ-152, рекомендации по уведомлению субъектов).
 * Сохраняет выбор в localStorage и шлёт событие site:cookie-preference для подключения аналитики.
 * detail.level: "all" | "essential"
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'site_cookie_pref_v1';

  function policyHref() {
    var path = window.location.pathname || '';
    if (/(?:\/geo\/|\/uslugi\/)/.test(path)) return '../politika-konfidencialnosti.html';
    return 'politika-konfidencialnosti.html';
  }

  function getPref() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setPref(val) {
    try {
      localStorage.setItem(STORAGE_KEY, val);
    } catch (e) {}
    try {
      document.dispatchEvent(new CustomEvent('site:cookie-preference', { detail: { level: val } }));
    } catch (e2) {}
    var bar = document.getElementById('cookieConsentBar');
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function ensureRehydrateEvent() {
    var p = getPref();
    if (p === 'all' || p === 'essential') {
      try {
        document.dispatchEvent(new CustomEvent('site:cookie-preference', { detail: { level: p, restored: true } }));
      } catch (e) {}
    }
  }

  function mount() {
    if (getPref()) return;

    var ph = policyHref();
    var bar = document.createElement('div');
    bar.id = 'cookieConsentBar';
    bar.className = 'cookie-consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Уведомление о файлах cookie');
    bar.innerHTML =
      '<div class="cookie-consent__inner container">' +
      '<p class="cookie-consent__text">Мы используем файлы cookie и схожие технологии для работы сайта и (при вашем согласии) аналитики. Подробнее — в <a href="' +
      ph +
      '#cookie">Политике конфиденциальности</a> (раздел о cookie).</p>' +
      '<div class="cookie-consent__actions">' +
      '<button type="button" class="cmn--btn cookie-consent__btn" id="cookieAcceptAll"><span>Принять все</span></button>' +
      '<button type="button" class="btn-ghost cookie-consent__btn-ghost" id="cookieEssentialOnly">Только необходимые</button>' +
      '</div></div>';

    document.body.appendChild(bar);

    document.getElementById('cookieAcceptAll').addEventListener('click', function () {
      setPref('all');
    });
    document.getElementById('cookieEssentialOnly').addEventListener('click', function () {
      setPref('essential');
    });
  }

  ensureRehydrateEvent();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
