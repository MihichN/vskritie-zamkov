(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var yearEl = document.getElementById('y');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }

    /* Плавный скролл для якорей */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1) {
          var el = document.querySelector(id);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    /* Плавающая кнопка звонка */
    var fab = document.getElementById('fabCall');
    var formSec = document.getElementById('contact');
    if (fab) {
      function updateFab() {
        var y = window.scrollY || document.documentElement.scrollTop;
        var show = y > 300;
        if (!formSec) {
          fab.classList.toggle('is-visible', show);
          return;
        }
        var rect = formSec.getBoundingClientRect();
        var formVisible = rect.top < window.innerHeight && rect.bottom > 0;
        fab.classList.toggle('is-visible', show && !formVisible);
      }
      window.addEventListener('scroll', updateFab, { passive: true });
      updateFab();
    }

    /* Регионы */
    document.querySelectorAll('.region-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var exp = btn.getAttribute('aria-expanded') === 'true';
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (!panel) return;
        btn.setAttribute('aria-expanded', String(!exp));
        panel.classList.toggle('is-open', !exp);
      });
    });

    /* FAQ: один открытый */
    var faqButtons = document.querySelectorAll('.faq-btn');
    faqButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        var target = document.getElementById(btn.getAttribute('aria-controls'));
        if (!target) return;
        faqButtons.forEach(function (b) {
          b.setAttribute('aria-expanded', 'false');
          var p = document.getElementById(b.getAttribute('aria-controls'));
          if (p) p.style.maxHeight = '0px';
        });
        if (!open) {
          btn.setAttribute('aria-expanded', 'true');
          target.style.maxHeight = target.scrollHeight + 'px';
        }
      });
    });

    /* Маска телефона +7 */
    var phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var d = phoneInput.value.replace(/\D/g, '');
        if (d.startsWith('8')) d = '7' + d.slice(1);
        if (d.startsWith('9')) d = '7' + d;
        if (!d.startsWith('7')) d = '7' + d.replace(/^7+/, '');
        d = d.slice(0, 11);
        var formatted = '+7';
        if (d.length > 1) formatted += ' (' + d.slice(1, 4);
        if (d.length >= 4) formatted += ') ';
        if (d.length >= 5) formatted += d.slice(4, 7);
        if (d.length >= 7) formatted += '-' + d.slice(7, 9);
        if (d.length >= 9) formatted += '-' + d.slice(9, 11);
        phoneInput.value = formatted;
      });
    }

    /* Форма: AJAX FormSubmit */
    var leadForm = document.getElementById('leadForm');
    var formBtn = document.getElementById('formSubmitBtn');
    var formSuccess = document.getElementById('formSuccess');
    var C = window.SITE_CONFIG || {};
    var formEmail = C.EMAIL || 'info@master-zamkov.ru';
    var formSubject = C.FORM_SUBJECT || 'Заявка master-zamkov.ru';

    if (leadForm && formBtn && formSuccess && phoneInput) {
      leadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('name').value.trim();
        var phoneDigits = phoneInput.value.replace(/\D/g, '');
        var service = document.getElementById('service').value;
        var address = document.getElementById('address').value.trim();
        var comment = document.getElementById('comment').value.trim();
        if (!name || phoneDigits.length < 11 || !service || !address) {
          leadForm.reportValidity();
          return;
        }
        formBtn.disabled = true;
        fetch('https://formsubmit.co/ajax/' + encodeURIComponent(formEmail), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name: name,
            phone: phoneInput.value,
            service: service,
            address: address,
            comment: comment || '—',
            _subject: formSubject
          })
        })
          .then(function (res) {
            if (!res.ok) throw new Error('network');
            formBtn.style.display = 'none';
            formSuccess.classList.add('is-visible');
          })
          .catch(function () {
            formBtn.disabled = false;
            alert('Не удалось отправить. Позвоните по телефону на сайте.');
          });
      });
    }

    /* Параллакс SVG в hero */
    var heroSvg = document.getElementById('heroLockSvg');
    var banner = document.querySelector('.banner__section');
    if (heroSvg && banner) {
      banner.addEventListener('mousemove', function (e) {
        var r = heroSvg.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = (e.clientX - cx) / 40;
        var dy = (e.clientY - cy) / 40;
        heroSvg.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
    }

    /* Marquee: дублирование трека */
    var track = document.querySelector('.marquee-track');
    if (track && track.children.length && !track.dataset.duplicated) {
      track.dataset.duplicated = '1';
      track.innerHTML = track.innerHTML + track.innerHTML;
    }
  });
})();
