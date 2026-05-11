(function ($) {
  "use strict";

  function formatPhoneRu(v) {
    var d = String(v).replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    var out = "+7";
    if (d.length > 1) out += " (" + d.slice(1, 4);
    if (d.length >= 4) out += ")";
    if (d.length > 4) out += " " + d.slice(4, 7);
    if (d.length > 7) out += "-" + d.slice(7, 9);
    if (d.length > 9) out += "-" + d.slice(9, 11);
    return out;
  }

  $(function () {
    var $float = $("#zamok-float-call");
    var $formZone = $("#contact.zamok-contact-zone-inner, #contact");

    function floatVisibility() {
      var y = $(window).scrollTop();
      var inView = false;
      if ($formZone.length) {
        var rect = $formZone[0].getBoundingClientRect();
        inView = rect.top < window.innerHeight && rect.bottom > 120;
      }
      if (y > 300 && !inView) $float.addClass("visible").removeClass("hidden-near-form");
      else if (inView) $float.addClass("hidden-near-form").removeClass("visible");
      else $float.removeClass("visible hidden-near-form");
    }

    $(window).on("scroll resize", floatVisibility);
    floatVisibility();

    var COOKIE_KEY = "zamok_cookie_consent";
    var $banner = $("#zamok-cookie-banner");
    function hideCookieBanner() {
      $banner.removeClass("is-visible").attr("hidden", "hidden").attr("aria-hidden", "true");
      $("body").removeClass("zamok-cookie-banner-open");
    }
    function showCookieBanner() {
      $banner.removeAttr("hidden").addClass("is-visible").attr("aria-hidden", "false");
      $("body").addClass("zamok-cookie-banner-open");
    }
    if ($banner.length && !localStorage.getItem(COOKIE_KEY)) {
      showCookieBanner();
    }
    $banner.on("click", "[data-zamok-cookie-accept]", function () {
      localStorage.setItem(COOKIE_KEY, "all");
      hideCookieBanner();
    });
    $banner.on("click", "[data-zamok-cookie-essential]", function () {
      localStorage.setItem(COOKIE_KEY, "essential");
      hideCookieBanner();
    });

    $("form[data-landing-form]").each(function () {
      var $form = $(this);
      var $tel = $form.find(".zamok-phone-input");
      var $ok = $form.next(".zamok-form-success");

      $tel.on("input", function () {
        this.value = formatPhoneRu(this.value);
      });

      $form.on("submit", function (e) {
        e.preventDefault();
        var name = $.trim($form.find('[name="name"]').val());
        var phoneDigits = ($tel.val() || "").replace(/\D/g, "");
        var $consent = $form.find('input[name="consent_pdn"]');
        var consentOk = $consent.length ? $consent.prop("checked") : true;
        if (name.length < 2 || phoneDigits.length < 11 || !consentOk) return false;
        $form.find('[type="submit"]').hide();
        if ($ok.length) {
          $ok.removeAttr("hidden").addClass("show");
        }
        return false;
      });
    });
  });
})(jQuery);
