/**
 * Генерирует посадочные HTML под услуги и гео (ЗАМОК.ПРО).
 * Запуск из корня проекта: node scripts/generate-landings.mjs
 */
import fs from "fs";
import path from "path";
import vm from "node:vm";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadZamokSiteConfig() {
  const cfgPath = path.join(ROOT, "js", "config.js");
  const code = fs.readFileSync(cfgPath, "utf8");
  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  if (!sandbox.ZAMOK_SITE_CONFIG) {
    throw new Error("В js/config.js отсутствует ZAMOK_SITE_CONFIG после выполнения файла.");
  }
  return sandbox.ZAMOK_SITE_CONFIG;
}

const Z = loadZamokSiteConfig();
/** Без хвостового «/», чтобы не дублировать слэши в canonical и JSON-LD */
const SITE_ORIGIN = Z.site.url.replace(/\/+$/, "");
const phoneDisplay = Z.contact.phoneDisplay;
const phoneTel = Z.contact.phoneE164;
const contactEmail = Z.contact.email;
const brandName = Z.brand.name;
const floatCallAria = Z.contact.floatCallAriaLabel || "Позвонить";

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(parts) {
  const {
    title,
    description,
    canonicalPath,
    h1,
    lead,
    paragraphs,
    areaServedName,
    formSelectPreset = "",
    relatedNavTitle = "",
    relatedLinks = [],
    faqPairs = [],
  } = parts;

  const canonical = `${SITE_ORIGIN}${canonicalPath}`;

  /** от корня страницы к ассетам: uslugi/x.html -> ../ */
  const depth = canonicalPath.replace(/^\//, "").split("/").length - 1;
  const rootPrefix = "../".repeat(Math.max(depth, 0)) || "./";

  const faqLd =
    faqPairs.length > 0
      ? `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${faqPairs
    .map(
      ([q, a]) =>
        `{"@type":"Question","name":${JSON.stringify(q)},"acceptedAnswer":{"@type":"Answer","text":${JSON.stringify(a)}}}`
    )
    .join(",")}]}
  </script>`
      : "";

  const locksmithLd = `
  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Locksmith",
    name: brandName,
    url: `${SITE_ORIGIN}/`,
    telephone: phoneTel,
    areaServed: { "@type": "Place", name: areaServedName },
  })}
  </script>`;

  const relatedBlock =
    relatedLinks.length > 0
      ? `
    <section class="section-padding section-zamok-cream pt-0">
      <div class="container">
        <h2 class="h4 mb-3">${escHtml(relatedNavTitle)}</h2>
        <ul class="list-unstyled d-flex flex-wrap gap-2">${relatedLinks
          .map(
            ([href, label]) =>
              `<li><a href="${href}" class="badge rounded-pill text-decoration-none" style="background:rgba(13,35,64,.08);color:#0d2340;padding:.5rem .9rem">${escHtml(
                label
              )}</a></li>`
          )
          .join("")}
        </ul>
      </div>
    </section>`
      : "";

  const paraHtml = paragraphs
    .map((p) => `<p class="pp-text" style="max-width:48rem">${escHtml(p)}</p>`)
    .join("\n");

  const optSelected = {
    door: formSelectPreset === "door",
    car: formSelectPreset === "car",
    safe: formSelectPreset === "safe",
    office: formSelectPreset === "office",
  };

  function optSel(key) {
    return optSelected[key] ? " selected" : "";
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(description)}">
  <link rel="shortcut icon" href="${rootPrefix}images/favicon.svg">
  <link rel="stylesheet" href="${rootPrefix}css/bootstrap.min.css">
  <link rel="stylesheet" href="${rootPrefix}css/all.min.css">
  <link rel="stylesheet" href="${rootPrefix}css/animate.css">
  <link rel="stylesheet" href="${rootPrefix}css/magnific-popup.css">
  <link rel="stylesheet" href="${rootPrefix}css/meanmenu.css">
  <link rel="stylesheet" href="${rootPrefix}css/swiper-bundle.min.css">
  <link rel="stylesheet" href="${rootPrefix}css/nice-select.css">
  <link rel="stylesheet" href="${rootPrefix}css/main.css">
  <link rel="stylesheet" href="${rootPrefix}css/zamok-pro.css">${locksmithLd}${faqLd}
</head>
<body class="zamok-pro zamok-landing">

<div id="preloader" class="preloader">
  <div class="animation-preloader">
    <div class="spinner"></div>
    <div class="txt-loading">
      <span class="letters-loading">З</span><span class="letters-loading">А</span><span class="letters-loading">М</span><span class="letters-loading">О</span><span class="letters-loading">К</span><span class="letters-loading">П</span><span class="letters-loading">Р</span><span class="letters-loading">О</span>
    </div>
    <p class="text-center">Загрузка</p>
  </div>
  <div class="loader"><div class="row">
    <div class="col-3 loader-section section-left"><div class="bg"></div></div>
    <div class="col-3 loader-section section-left"><div class="bg"></div></div>
    <div class="col-3 loader-section section-right"><div class="bg"></div></div>
    <div class="col-3 loader-section section-right"><div class="bg"></div></div>
  </div></div>
</div>

<button type="button" id="pp-back-top" class="pp-back-to-top show" aria-label="Наверх"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>
<div class="mouseCursor cursor-outer" aria-hidden="true"></div>
<div class="mouseCursor cursor-inner" aria-hidden="true"></div>
<a href="tel:${phoneTel}" id="zamok-float-call" class="zamok-float-call" aria-label="${escHtml(floatCallAria)}"><i class="fa-solid fa-phone" aria-hidden="true"></i></a>

<div class="fix-area">
  <div class="offcanvas__info">
    <div class="offcanvas__wrapper">
      <div class="offcanvas__content">
        <div class="offcanvas__top mb-5 d-flex justify-content-between align-items-center">
          <div class="offcanvas__logo"><a href="${rootPrefix}index.html#top" class="zamok-logo">ЗАМОК<span class="dot-pro">.ПРО</span></a></div>
          <div class="offcanvas__close"><button type="button" aria-label="Закрыть"><i class="fas fa-times"></i></button></div>
        </div>
        <div class="mobile-menu fix mb-3"></div>
        <div class="offcanvas__contact">
          <ul>
            <li class="d-flex align-items-center"><a href="mailto:${contactEmail.replace(/"/g, "")}">${escHtml(contactEmail)}</a></li>
            <li class="d-flex align-items-center"><a href="tel:${phoneTel}">${phoneDisplay}</a></li>
          </ul>
          <a href="#contact" class="pp-theme-btn mt-3 d-inline-block">Вызвать мастера</a>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="offcanvas__overlay"></div>

<header id="header-sticky" class="header-1">
  <div class="container-fluid">
    <div class="mega-menu-wrapper">
      <div class="header-main style-1 align-items-center">
        <div class="logo zamok-header-logo">
          <a href="${rootPrefix}index.html#top" id="top" class="header-logo zamok-logo">ЗАМОК<span class="dot-pro">.ПРО</span></a>
        </div>
        <div class="d-flex d-xl-none align-items-center ms-auto me-2 zamok-header-phone"><a href="tel:${phoneTel}">${phoneDisplay}</a></div>
        <div class="mean__menu-wrapper flex-grow-1">
          <div class="main-menu">
            <nav id="mobile-menu" aria-label="Меню">
              <ul>
                <li><a href="${rootPrefix}index.html#services">Услуги</a></li>
                <li><a href="${rootPrefix}index.html#faq">Вопросы и ответы</a></li>
                <li><a href="${rootPrefix}uslugi/">Все услуги</a></li>
                <li><a href="${rootPrefix}geo/">География выездов</a></li>
              </ul>
            </nav>
          </div>
        </div>
        <div class="header-right d-flex justify-content-end align-items-center gap-3">
          <a href="tel:${phoneTel}" class="zamok-header-phone d-none d-xl-block">${phoneDisplay}</a>
          <a href="#contact" class="pp-theme-btn d-none d-xl-inline-flex">Вызвать мастера</a>
          <div class="header__hamburger d-xl-none my-auto"><div class="sidebar__toggle"><div class="header-bar style-1"><span></span><span></span></div></div></div>
        </div>
      </div>
    </div>
  </div>
</header>

<section class="pp-hero-section pp-hero-1 fix zamok-hero" style="padding-top:clamp(8rem,12vw,10rem)!important">
  <div class="top-shape"><img src="${rootPrefix}images/hero-bg.png" alt="" width="1200" height="400" decoding="async"></div>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-xl-10">
        <div class="pp-hero-content text-center px-2 px-md-4">
          <div class="zamok-badge-live wow fadeInUp mx-auto mb-3" style="width:fit-content"><span class="pulse-dot" aria-hidden="true"></span>Работаем 24/7</div>
          <h1 class="wow fadeInUp">${escHtml(h1)}</h1>
          <p class="zamok-subtitle-brief wow fadeInUp mx-auto">${escHtml(lead)}</p>
          <div class="pp-hero-button justify-content-center d-flex flex-wrap gap-3">
            <a href="tel:${phoneTel}" class="pp-theme-btn wow fadeInUp">Позвонить</a>
            <a href="#contact" class="pp-theme-btn pp-style-2 wow fadeInUp">Заявка онлайн</a>
          </div>
          <nav class="mt-4 wow fadeInUp small" aria-label="Навигация страницы"><a href="${rootPrefix}index.html" style="color:rgba(255,255,255,.85)">Главная</a></nav>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section-padding section-zamok-cream">
  <div class="container">${paraHtml}</div>
</section>

<section class="pp-how-work-section section-padding fix zamok-steps">
  <div class="top-shape"><img src="${rootPrefix}images/bg-shape.png" alt="" decoding="async"></div>
  <div class="container">
    <h2 class="text-white text-center h3 mb-4">Как мы работаем</h2>
    <div class="row justify-content-center">
      <div class="col-xl-9">
        <ol class="steps-list">
          <li><div><h3 class="mb-2">Звонок или заявка</h3><p>Уточняем адрес в районе работ и тип замка.</p></div></li>
          <li><div><h3 class="mb-2">Выезд мастера</h3><p>Среднее время 15–25 минут там, где это возможно.</p></div></li>
          <li><div><h3 class="mb-2">Осмотр и цена</h3><p>Стоимость до начала работ — после диагностики.</p></div></li>
          <li><div><h3 class="mb-2">Результат</h3><p>Аккуратное открывание и оплата после работы.</p></div></li>
        </ol>
      </div>
    </div>
  </div>
</section>
${relatedBlock}
<section id="contact" class="section-padding section-zamok-cream pb-5 zamok-contact-zone zamok-contact-zone-inner">
  <div class="container">
    <div class="row g-5 align-items-start">
      <div class="col-lg-6">
        <h2 class="mb-3">Заявка на выезд${areaServedName ? ` (${escHtml(areaServedName)})` : ""}</h2>
        <p class="mb-4">Телефон круглосуточно: <a href="tel:${phoneTel}" class="zamok-link-arrow">${phoneDisplay}</a></p>
      </div>
      <div class="col-lg-6">
        <div class="zamok-form-card">
          <form class="zamok-lead-form" method="post" action="#" novalidate data-landing-form>
            <div class="mb-3"><label for="zamok-name-land">Имя</label><input id="zamok-name-land" name="name" type="text" required autocomplete="name" placeholder="Как к вам обращаться"></div>
            <div class="mb-3"><label for="zamok-phone-land">Телефон</label><input id="zamok-phone-land" name="phone" type="tel" required autocomplete="tel" placeholder="+7 (___) ___-__-__" inputmode="numeric" class="zamok-phone-input"></div>
            <div class="mb-3"><label for="zamok-type-land">Тип услуги</label><select id="zamok-type-land" name="service" class="single-select wide w-100" required>
              <option value="">Выберите услугу</option>
              <option value="door"${optSel("door")}>Квартира / дом</option>
              <option value="car"${optSel("car")}>Автомобиль</option>
              <option value="safe"${optSel("safe")}>Сейф</option>
              <option value="office"${optSel("office")}>Офис / склад</option>
            </select></div>
            <div class="mb-3"><label for="zamok-address-land">Адрес</label><input id="zamok-address-land" name="address" type="text" required autocomplete="street-address" placeholder="Улица, дом, подъезд"></div>
            <div class="mb-3"><label for="zamok-comment-land">Комментарий</label><textarea id="zamok-comment-land" name="comment" rows="3" placeholder="Подъезд, домофон, ситуация"></textarea></div>
            <button type="submit" class="pp-theme-btn w-100">Отправить</button>
          </form>
          <p class="zamok-form-success mt-3" hidden role="status">Спасибо! Перезвоним в ближайшее время.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<footer class="pp-footer-section zamok-footer">
  <div class="container text-center pt-5">
    <a href="tel:${phoneTel}" class="d-inline-block mb-4" style="font-weight:800;font-size:clamp(1.2rem,3vw,1.75rem);color:#fff!important">${phoneDisplay}</a>
    <nav class="d-flex flex-wrap justify-content-center gap-3 pb-5 small"><a href="${rootPrefix}index.html" style="color:rgba(255,255,255,.8)">Главная</a><a href="${rootPrefix}index.html#services" style="color:rgba(255,255,255,.8)">Услуги</a><a href="${rootPrefix}uslugi/" style="color:rgba(255,255,255,.8)">Все услуги</a><a href="${rootPrefix}geo/" style="color:rgba(255,255,255,.8)">Районы</a></nav>
    <p class="small" style="color:rgba(255,255,255,.55)">© ${escHtml(brandName)}</p>
  </div>
</footer>

<script src="${rootPrefix}js/jquery-3.7.1.min.js"></script><script src="${rootPrefix}js/viewport.jquery.js"></script><script src="${rootPrefix}js/bootstrap.bundle.min.js"></script>
<script src="${rootPrefix}js/jquery.nice-select.min.js"></script><script src="${rootPrefix}js/jquery.meanmenu.min.js"></script><script src="${rootPrefix}js/wow.min.js"></script><script src="${rootPrefix}js/main.js"></script>
<script src="${rootPrefix}js/zamok-landing.js"></script>
</body>
</html>`;
}

/** depth: uslugi = 1, geo = 1 */
function writePage(subdir, slug, payload) {
  const relDir = `${subdir}`;
  const filePath = path.join(ROOT, relDir, `${slug}.html`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const canonicalPath =
    slug === "index"
      ? `/${subdir}/`
      : `/${subdir}/${slug}.html`;
  const html = shell({
    ...payload,
    canonicalPath,
  });
  fs.writeFileSync(filePath, html, "utf8");
}

const services = [
  {
    slug: "kvartira-dom",
    title: "Вскрытие замков квартир и частных домов в Москве и СПб | ЗАМОК.ПРО",
    description:
      "Профессиональное аварийное вскрытие входной двери квартиры и дома без лишних повреждений. Выезд ЗАМОК.ПРО 24/7, Москва и Санкт-Петербург с областями.",
    h1: "Вскрытие замков квартиры и дома — выезд службы ЗАМОК.ПРО",
    lead: "Захлопнулась дверь, ключ внутри, заклинило замок — приедем аккуратно, цена после осмотра.",
    areaServedName: "Россия — Москва, МО, СПб, ЛО",
    formSelectPreset: "door",
    paragraphs: [
      "Служба ЗАМОК.ПРО выполняет вскрытие входных групп квартир и частных домов: навесные замки цилиндровые и сувальдные, электромеханические системы и бронированные комплексы. Приоритет — неразрушающие методы, чтобы по возможности сохранить механизм и полотно двери.",
      "Выезд возможен по Москве, Московской области, Санкт-Петербургу и Ленинградской области. Оператор уточнит адрес и направит ближайшего замочника. Минимальная стоимость работ указана при звонке; итог согласуется после диагностики на месте — до начала вскрытия.",
      "Нужно вскрытие без ключа после потери ключей или поломки — оставьте заявку или позвоните на горячую линию.",
    ],
    faqPairs: [
      ["Сохранится ли замок после вскрытия?", "Чаще всего да — используем инструменты и техники профессионального вскрытия. Если механизм не подлежит восстановлению, мастер предложит замену до начала работ."],
      ["Работаете ночью и в праздники?", "Да, формат 24/7 для звонков и выездов."],
      ["От чего зависит цена?", "От типа замка, времени доступа и сложности; точная сумма после осмотра."],
    ],
    relatedLinks: [
      [`../uslugi/avtomobil.html`, "Автомобиль"],
      [`../uslugi/sejf.html`, "Сейф"],
      [`../uslugi/ofis-sklad.html`, "Офис / склад"],
      [`../geo/moskva.html`, "Москва"],
      [`../geo/sankt-peterburg.html`, "СПб"],
    ],
  },
  {
    slug: "avtomobil",
    title: "Вскрытие автомобильных замков — Москва и СПб | ЗАМОК.ПРО",
    description:
      "Вскрытие замка автомобиля профессиональными средствами. Аварийный выезд ЗАМОК.ПРО в Москве, МО и Санкт-Петербурге с ЛО.",
    h1: "Вскрытие автомобильного замка с выездом мастера",
    lead: "Ключ забыт в салоне, не поворачивается личинка или сработала блокировка — поможем открыть авто аккуратно.",
    areaServedName: "Москва, МО, СПб, ЛО",
    formSelectPreset: "car",
    paragraphs: [
      "Мастера ЗАМОК.ПРО работают с личинками, штатными противоугонными комплексами и ситуациями, когда дверь не открыть без повреждения покраски или уплотнителей только при сохранении заводских решений. Подберём технологию под марку автомобиля и вашу задачу.",
      "Выезд возможен из Санкт-Петербурга, Москвы и по ближайшим территориям областей при наличии свободных бригад. Срок прибытия зависит от загрузки и расстояния — ориентир уточнит оператор при звонке.",
    ],
    relatedLinks: [
      [`../uslugi/kvartira-dom.html`, "Квартира / дом"],
      [`../uslugi/sejf.html`, "Сейф"],
      [`../geo/moskva.html`, "Москва"],
      [`../geo/sankt-peterburg.html`, "СПб"],
    ],
  },
  {
    slug: "sejf",
    title: "Вскрытие сейфов в Москве и Санкт-Петербурге | ЗАМОК.ПРО",
    description:
      "Профессиональное вскрытие сейфов и электронных панелей. Диагностика, сохранность корпуса там, где это возможно, цена после осмотра.",
    h1: "Вскрытие сейфа — офисного и домашнего",
    lead: "Утерян код или ключ от сейфа — восстановим доступ с минимизацией риска для механизма.",
    areaServedName: "Москва, МО, СПб, ЛО",
    formSelectPreset: "safe",
    paragraphs: [
      "Различаются накопительные, офисные и мебельные модели — подход зависит от класса замка и защиты. Специалист оценивает возможность сохранительного входа или комбинированного метода после осмотра на месте.",
      "Юридическим лицам и частным клиентам важна прозрачность: финальную стоимость называем до начала интрузии в корпус, если иной сценарий невозможен технически.",
    ],
    relatedLinks: [
      [`../uslugi/ofis-sklad.html`, "Офис / склад"],
      [`../uslugi/kvartira-dom.html`, "Квартира / дом"],
      [`../geo/sankt-peterburg.html`, "СПб"],
      [`../geo/moskva.html`, "Москва"],
    ],
  },
  {
    slug: "ofis-sklad",
    title: "Вскрытие офисных и складских замков | ЗАМОК.ПРО Москва СПб",
    description:
      "Аварийное вскрытие офиса, складского блока и служебных помещений. ЗАМОК.ПРО: выезд для бизнеса в Москве, МО, СПб и ЛО.",
    h1: "Вскрытие офисных и складских замков",
    lead: "Потеряны ключи от переговорной или производственного блока — организуем выезд без лишней бюрократии.",
    areaServedName: "Москва, МО, СПб, ЛО",
    formSelectPreset: "office",
    paragraphs: [
      "Поддерживаем корпоративных клиентов и малый бизнес: служебные входы, металлоконструкции, контейнерные и складские модули. Согласование цены перед работами и по возможности неразрушающий доступ сохраняют рабочий ритм.",
      "При необходимости предложим дальнейшую замену узла или временное решение до поставки фурнитуры.",
    ],
    relatedLinks: [
      [`../uslugi/sejf.html`, "Сейф"],
      [`../uslugi/kvartira-dom.html`, "Квартира / дом"],
      [`../geo/moskovskaya-oblast.html`, "МО"],
      [`../geo/leningradskaya-oblast.html`, "ЛО"],
    ],
  },
];

const regions = [
  {
    slug: "moskva",
    title: "Вскрытие замков в Москве 24/7 — выезд мастера | ЗАМОК.ПРО",
    description:
      "Вскрытие замков в Москве без лишних повреждений. Аварийный выезд ЦАО, ЗАО, ЮАО, САО и др. От 1500 ₽ после осмотра — ЗАМОК.ПРО.",
    h1: "Вскрытие замков в Москве — срочный выезд",
    lead: "Круглосуточная служба профессионального вскрытия по всей Москве.",
    areaServedName: "Москва",
    paragraphs: [
      "Столица — плотный трафик и разные классы объектов от сталинских дверей до современных квартирных комплексов. ЗАМОК.ПРО поддерживает мастерную сеть во всех крупных зонах: приезжаем оперативно туда, куда возможно пробиться по загрузке ближайшей бригады.",
      "Работаем с квартирными, офисными, сейфовыми и автомобильными замками. Итоговая цена — после осмотра, до начала работ.",
      "Выберите район ниже или оставьте заявку с адресом — оператор закрепит выезд под вашу задачу.",
    ],
    relatedNavTitle: "Районы Москвы и разделы",
    relatedLinks: [
      [`./moskovskaya-oblast.html`, "Московская область"],
      [`./maryino.html`, "Марьино"],
      [`./mitino.html`, "Митино"],
      [`./vyhino.html`, "Выхино"],
      [`../uslugi/kvartira-dom.html`, "Квартира / дом"],
    ],
  },
  {
    slug: "moskovskaya-oblast",
    title: "Вскрытие замков в Московской области | ЗАМОК.ПРО Химки Одинцово",
    description:
      "Аварийное вскрытие замков в МО: Химки, Одинцово, Мытищи, Балашиха, Подольск, Красногорск и др. Выезд ЗАМОК.ПРО 24/7.",
    h1: "Вскрытие замков в Московской области",
    lead: "Ближайшее Подмосковье и отдалённые городские округа — уточняйте ETA при звонке.",
    areaServedName: "Московская область",
    paragraphs: [
      "Клиенты часто звонят из Химок, Балашихи, Подольска, Люберец, Одинцово и Красногорска. Время доехать зависит от трассы и очередей — сообщаем правдивые оценки оператором.",
      "Технологический подход совпадает с Москвой: неразрушающее открывание там, где применимо, и прозрачная смета.",
    ],
    relatedLinks: [
      [`./moskva.html`, "Москва"],
      [`../uslugi/kvartira-dom.html`, "Квартира / дом"],
    ],
  },
  {
    slug: "sankt-peterburg",
    title: "Вскрытие замков в Санкт-Петербурге 24/7 | ЗАМОК.ПРО СПб",
    description:
      "Профессиональное вскрытие замков СПб: центр и спальные районы. Мастер замочник Петербург, выезд официально, без лишних рисков.",
    h1: "Вскрытие замков в Санкт-Петербурге",
    lead: "Служба ЗАМОК.ПРО на связи днём и ночью по всему Петербургу.",
    areaServedName: "Санкт-Петербург",
    paragraphs: [
      "Петербургский фонд включает и центральные особняки и типовые дома на окраине. Под каждый объект подбираем инструмент и тактики открывания без «ломового» входа там, где это излишне.",
      "Поддерживаем смежную Ленобласть — если вы на границе или в промзонах Всеволожского округа, уточните адрес для расчёта выезда.",
    ],
    relatedNavTitle: "Районы СПб",
    relatedLinks: [
      [`./leningradskaya-oblast.html`, "ЛО"],
      [`./nevskiy-rayon.html`, "Невский район"],
      [`./primorskiy-rayon.html`, "Приморский"],
      [`../uslugi/kvartira-dom.html`, "Входная дверь"],
    ],
  },
  {
    slug: "leningradskaya-oblast",
    title: "Вскрытие замков в Ленинградской области | ЗАМОК.ПРО",
    description:
      "Вскрытие замков Всеволожск, Гатчина, Мурино, Кудрово, Сестрорецк и др. Выезд службы ЗАМОК.ПРО в ЛО круглосуточно.",
    h1: "Вскрытие замков в Ленинградской области",
    lead: "Покрываем ключевые муниципалитеты области и пригороды СПб.",
    areaServedName: "Ленинградская область",
    paragraphs: [
      "Популярные направления: Всеволожский и Гатчинский округа, включая быстроразвивающиеся Кудрово и Мурино. Время подъезда согласуем по карте загрузки бригады.",
      "Доступна та же экономика услуги: минимальный порог и фиксируем итог на месте.",
    ],
    relatedLinks: [
      [`./sankt-peterburg.html`, "СПб"],
      [`../uslugi/avtomobil.html`, "Авто"],
    ],
  },
];

const moscowDistricts = [
  { slug: "maryino", name: "Марьино", note: "ЮВАО, много типовых панельных дверных групп и металлоконструкций подъездов." },
  { slug: "mitino", name: "Митино", note: "СЗАО, новостройки с повышенной востребованностью аварийного вскрытия при потере ключей." },
  { slug: "butovo", name: "Южное Бутово", note: "ЮЗАО, крупная жилая зона с разнообразием импортных и цилиндровых систем." },
  { slug: "vyhino", name: "Выхино", note: "ЮВАО, плотная застройка — важно быстро подбирать ближайшего мастера." },
  { slug: "sokolniki", name: "Сокольники", note: "СВАО, смесь старых и новых фондов; разные классы профильных входных блоков." },
  { slug: "khamovniki", name: "Хамовники", note: "Центральная локация, повышенные требования к аккуратности фасада и личному составу при проходной." },
  { slug: "tsentr-tsao", name: "Центр Москвы (ЦАО)", note: "Бизнес- и жилая недвижимость высокого класса; сложные бронкомплекты и охранные схемы." },
  { slug: "izmaylovo", name: "Измайлово", note: "ВАО, массивы с советским и модернизированным жилым фондом." },
  { slug: "lefortovo", name: "Лефортово", note: "ЮВАО рядом с центром смешанная застройка и учебная инфраструктура." },
  { slug: "yaroslavskiy-rayon", name: "Ярославский район", note: "СВАО, жилые массивы и транспортные артерии в сторону МКАД." },
];

const spbDistricts = [
  { slug: "nevskiy-rayon", name: "Невский район", note: "Один из самых насыщенных транспортом — рассчитываем ETA реалистично." },
  { slug: "moskovskiy-rayon", name: "Московский район", note: "Юг города и МО у границ; частые выезды в жилые кварталы и ТЦ." },
  { slug: "vasileostrovskiy-rayon", name: "Василеостровский район", note: "Островная застройка, специфика подъехать и ограничения по времени возможны уточнить у оператора." },
  { slug: "primorskiy-rayon", name: "Приморский район", note: "Развита инфраструктура офисных и апарт-проектов под вскрытие сложных узлов." },
  { slug: "vyborgskiy-rayon", name: "Выборгский район", note: "Север города и примыкание к ЛО для комбинированных выездов." },
  { slug: "petrogradskiy-rayon", name: "Петроградская сторона", note: "Исторический фонд и современное жильё повышенного класса безопасности." },
  { slug: "tsentralnyy-rayon-spb", name: "Центральный район СПб", note: "Административные и дорогие жилые комплексы центра Невы." },
  { slug: "krasnoselskiy-rayon", name: "Красносельский район", note: "Запад и юго-запад агломерации, активный жилищный рынок." },
  { slug: "kalininskiy-rayon", name: "Калининский район", note: "Северная часть между проспектами — быстрый забор заявки на мастера из ближайшей зоны ответственности." },
  { slug: "frunzenskiy-rayon", name: "Фрунзенский район", note: "Плотная жилая среда с типовым и индивидуальным жилым фондом под разные задачи замочника." },
];

for (const s of services) {
  writePage("uslugi", s.slug, {
    ...s,
    relatedNavTitle: s.relatedNavTitle || "Связанные страницы",
    description: s.description.slice(0, 175),
    faqPairs: s.faqPairs || [],
  });
}

for (const r of regions) {
  writePage("geo", r.slug, {
    ...r,
    relatedNavTitle: r.relatedNavTitle || "Разделы",
    description: r.description.slice(0, 175),
    faqPairs: [],
  });
}

function districtPage(type, slug, name, note) {
  const isMoscow = type === "moscow";
  const cityLine = isMoscow ? "Москве" : "Санкт-Петербурге";
  const title = `Вскрытие замков в ${name} (${cityLine}) | ЗАМОК.ПРО`;
  const description =
    `${name}: срочное вскрытие замков и дверей в ${cityLine}. ЗАМОК.ПРО — официально, 24/7, без лишних повреждений.`.slice(0, 180);
  return {
    slug,
    title,
    description,
    h1: `Вскрытие замков в районе «${name}»`,
    lead: `Приезжаем работать в вашем округе (${cityLine}) — сообщите дом и подъезд для расчёта времени.`,
    areaServedName: `${name}`,
    paragraphs: [
      `${note}`,
      `Служба ЗАМОК.ПРО применяет единые стандарты для ${isMoscow ? "Москвы" : "Санкт-Петербурга"}: неразрушающее вскрытие при возможности, фиксируем стоимость после осмотра и работаем официально с обратной связью по качеству.`,
      `Выберите соседние территории через раздел география или переходите к услуге «Квартира / дом», «Авто» или «Офис» при необходимости.`,
    ],
    relatedLinks: [
      ...(isMoscow
        ? [
            [`./moskva.html`, "Москва"],
            [`./moskovskaya-oblast.html`, "Московская обл."],
          ]
        : [
            [`./sankt-peterburg.html`, "СПб"],
            [`./leningradskaya-oblast.html`, "ЛО"],
          ]),
      [`../uslugi/kvartira-dom.html`, "Квартира / дом"],
      [`../uslugi/avtomobil.html`, "Авто"],
    ],
    relatedNavTitle: "Рядом и по тематикам",
    faqPairs: [
      [`Как быстро доедете в район ${name}?`, "Отталкиваемся от свободного мастера и загрузки на линии; диапазон 15–25 минут возможен там, где бригада уже в округе или по границе."],
      ["Можно вызвать ночью?", "Да, линия 24/7, выезд возможен, если есть свободная бригада в пределах досягаемости."],
    ],
  };
}

for (const d of moscowDistricts) {
  const p = districtPage("moscow", d.slug, d.name, d.note);
  writePage("geo", d.slug, p);
}

for (const d of spbDistricts) {
  const p = districtPage("spb", d.slug, d.name, d.note);
  writePage("geo", d.slug, p);
}

/* Индекс-страницы разделов */
function indexListing(dir, title, intro, sections) {
  const rootPrefix = "../";
  const links = sections
    .map(
      (sec) =>
        `<div class="mb-5"><h2 class="h4 mb-3">${sec.heading}</h2><ul class="list-unstyled row g-2">${sec.items
          .map(([href, label]) => `<li class="col-12 col-md-6 col-xl-4"><a href="${href}" class="d-block py-2 px-3 rounded" style="background:rgba(13,35,64,.06);color:#0d2340;text-decoration:none">${label}</a></li>`)
          .join("")}</ul></div>`
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title)}</title><meta name="description" content="${escHtml(intro.slice(0, 160))}">
<link rel="canonical" href="${SITE_ORIGIN}/${dir}/">
<link rel="stylesheet" href="${rootPrefix}css/bootstrap.min.css"><link rel="stylesheet" href="${rootPrefix}css/main.css"><link rel="stylesheet" href="${rootPrefix}css/zamok-pro.css">
</head><body class="zamok-pro" style="padding-top:120px;background:#f5f0e6">
<div class="container pb-5">
  <nav class="mb-3 small"><a href="${rootPrefix}index.html">Главная</a></nav>
  <h1 class="mb-4">${escHtml(title)}</h1>
  <p class="mb-5" style="max-width:40rem">${escHtml(intro)}</p>${links}
</div></body></html>`;
  fs.writeFileSync(path.join(ROOT, dir, "index.html"), html, "utf8");
}

const serviceLabels = {
  "kvartira-dom": "Квартира и дом",
  avtomobil: "Автомобиль",
  sejf: "Сейф",
  "ofis-sklad": "Офис и склад",
};

indexListing(
  "uslugi",
  "Услуги ЗАМОК.ПРО — все посадочные",
  "Отдельные страницы под тип вскрытия: квартира, авто, сейф и офис/склад. Дублируем контакты и форму заказа на каждой.",
  [{ heading: "Услуги", items: services.map((s) => [`./${s.slug}.html`, serviceLabels[s.slug] || s.slug]) }]
);

indexListing(
  "geo",
  "География выезда ЗАМОК.ПРО — регионы и районы",
  "Страницы для SEO по Москве и области, Петербургу и ЛО, а также топовые районы для узких запросов.",
  [
    {
      heading: "Регионы",
      items: regions.map((r) => [
        `./${r.slug}.html`,
        { moskva: "Москва", "moskovskaya-oblast": "Московская область", "sankt-peterburg": "Санкт-Петербург", "leningradskaya-oblast": "Ленинградская область" }[r.slug] || r.slug,
      ]),
    },
    {
      heading: "Москва — округа и жилые зоны",
      items: moscowDistricts.map((d) => [`./${d.slug}.html`, d.name]),
    },
    {
      heading: "Санкт-Петербург — районы города",
      items: spbDistricts.map((d) => [`./${d.slug}.html`, d.name]),
    },
  ]
);

console.log(
  `OK: ${services.length} услуги, ${regions.length} региона, ${moscowDistricts.length} Москва, ${spbDistricts.length} СПб + индекс uslugi/ и geo/.`
);

const mapScript = path.join(__dirname, "generate-sitemap.mjs");
spawnSync(process.execPath, [mapScript], { stdio: "inherit", cwd: ROOT });
