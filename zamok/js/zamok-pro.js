(function ($) {
  "use strict";

  function formatPhoneRu(v) {
    var d = v.replace(/\D/g, "");
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
    var $phone = $("#zamok-phone");
    if ($phone.length) {
      $phone.on("input", function () {
        var el = this;
        var cur = el.value;
        var fmt = formatPhoneRu(cur);
        el.value = fmt;
      });
    }

    $(".zamok-faq .faq-q").on("click", function () {
      var $btn = $(this);
      var $item = $btn.closest(".faq-item");
      var expanded = $btn.attr("aria-expanded") === "true";
      $(".zamok-faq .faq-q").attr("aria-expanded", "false");
      $(".zamok-faq .faq-item").removeClass("open");
      if (!expanded) {
        $btn.attr("aria-expanded", "true");
        $item.addClass("open");
      }
    });

    $(".zamok-zones-accordion .zone-toggle").on("click", function () {
      var $btn = $(this);
      var id = $btn.attr("aria-controls");
      var $panel = $("#" + id);
      var open = $btn.attr("aria-expanded") === "true";
      $(".zamok-zones-accordion .zone-toggle").attr("aria-expanded", "false");
      $(".zamok-zones-accordion .zone-panel").removeClass("active");
      if (!open) {
        $btn.attr("aria-expanded", "true");
        $panel.addClass("active");
      }
    });

    $("#zamok-lead-form").on("submit", function (e) {
      e.preventDefault();
      var name = $.trim($("#zamok-name").val());
      var phoneDigits = ($("#zamok-phone").val() || "").replace(/\D/g, "");
      var consent = $("#zamok-consent-pdn").length
        ? $("#zamok-consent-pdn").prop("checked")
        : true;
      if (name.length < 2 || phoneDigits.length < 11 || !consent) {
        return false;
      }
      $(this).find('button[type="submit"]').hide();
      $("#zamok-form-success").addClass("show");
      return false;
    });

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

    var $float = $("#zamok-float-call");
    var $formBlock = $("#contact");
    function floatVisibility() {
      var y = $(window).scrollTop();
      var inView = false;
      if ($formBlock.length) {
        var rect = $formBlock[0].getBoundingClientRect();
        inView = rect.top < window.innerHeight && rect.bottom > 0;
      }
      if (y > 300 && !inView) {
        $float.addClass("visible").removeClass("hidden-near-form");
      } else if (inView) {
        $float.addClass("hidden-near-form").removeClass("visible");
      } else {
        $float.removeClass("visible hidden-near-form");
      }
    }
    $(window).on("scroll resize", floatVisibility);
    floatVisibility();
  });
})(jQuery);
