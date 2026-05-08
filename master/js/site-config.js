/**
 * Единый источник данных сайта. Меняйте значения здесь — после сохранения и обновления
 * страницы в браузере подставятся новые телефон, бренд, цены и т.д.
 * Подключение: site-config.js (без defer), затем site-bind.js и main.js с defer.
 * При смене домена обновите SITE_URL и SCHEMA_ORG_ID; файлы sitemap.xml и robots.txt
 * правятся отдельно — поисковики их не читают из JS.
 */
window.SITE_CONFIG = {
  SITE_URL: 'https://master-zamkov.ru',
  PHONE_E164: '+78001234568',
  PHONE_DISPLAY: '8 800 123-45-68',
  PHONE_FAB_ARIA: 'Позвонить: 8 800 123-45-68',
  EMAIL: 'info@master-zamkov.ru',
  BRAND_SHORT: 'МАСТЕР.РФ',
  BRAND_LEGAL: 'МАСТЕР-ЗАМКОВ',
  BRAND_LOGO_MAIN: 'МАСТЕР',
  BRAND_LOGO_TLD: '.РФ',
  SCHEMA_ORG_ID: 'https://master-zamkov.ru/#organization',
  FORM_SUBJECT: 'Заявка master-zamkov.ru',
  HERO_MESSENGER_NOTE: 'Бесплатно по России · Telegram и WhatsApp — появятся на сайте',
  COPYRIGHT_NOTE: 'Вскрытие и замена замков. Телефон и email — заменить перед запуском.',
  STAT_VISITS: '7 200+',
  STAT_YEARS: 'с 2019 года',
  STAT_RATING_PILL: '4.9★ от клиентов',
  STAT_RATING_VALUE: '4.9',
  STAT_REVIEWS: '412+',
  STAT_YEARS_SHORT: '6 лет',
  STAT_SUCCESS_PERCENT: '97%',
  OFFER_VALID_UNTIL: '2027-12-31',
  PRICE_KVARTIRA: '1500',
  PRICE_AVTO: '1500',
  PRICE_SEIF: '2500',
  PRICE_OFIS: '2000',
  PRICE_TAG_KVARTIRA: 'от 1 500 ₽',
  PRICE_TAG_AVTO: 'от 1 500 ₽',
  PRICE_TAG_SEIF: 'от 2 500 ₽',
  PRICE_TAG_OFIS: 'от 2 000 ₽',
  FAQ_COST_SENTENCE:
    'Минимальная стоимость работы стартует от 1 500 рублей. Итоговая цена зависит от типа замка и сложности ситуации. Мастер называет точную стоимость после осмотра, до начала работы. Оплата производится после результата.'
};
