# -*- coding: utf-8 -*-
"""Пакетно добавляет скрипты конфига и плейсхолдеры {KEY} (geo + uslugi). index.html правьте отдельно или вручную."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def patch_scripts_block(text: str, depth: int) -> str:
    if depth == 0:
        old, new = (
            '<script src="js/main.js"></script>',
            '  <script src="js/site-config.js"></script>\n'
            '  <script defer src="js/site-bind.js"></script>\n'
            '  <script defer src="js/main.js"></script>',
        )
    else:
        old, new = (
            '<script src="../js/main.js"></script>',
            '  <script src="../js/site-config.js"></script>\n'
            '  <script defer src="../js/site-bind.js"></script>\n'
            '  <script defer src="../js/main.js"></script>',
        )
    return text.replace(old, new) if old in text else text


def base_url_replacements(text: str) -> str:
    return text.replace("https://master-zamkov.ru", "{SITE_URL}")


def patch_common_phone_logo(text: str) -> str:
    text = text.replace(
        '<a class="fab-call" id="fabCall" href="tel:+78001234568" aria-label="Позвонить: 8 800 123-45-68">',
        '<a class="fab-call" id="fabCall" href="tel:{PHONE_E164}" aria-label="{PHONE_FAB_ARIA}">',
    )
    text = text.replace(
        '<a class="logo" href="../index.html#top">МАСТЕР<span>.РФ</span></a>',
        '<a class="logo" href="../index.html#top"><span data-site="BRAND_LOGO_MAIN"></span><span data-site="BRAND_LOGO_TLD"></span></a>',
    )
    text = text.replace(
        '<a class="cmn--btn header-cta" href="tel:+78001234568"><span>8 800 123-45-68</span></a>',
        '<a class="cmn--btn header-cta" href="tel:{PHONE_E164}"><span data-site="PHONE_DISPLAY"></span></a>',
    )
    text = text.replace(
        '<p class="footer-tel"><a href="tel:+78001234568">8 800 123-45-68</a></p>',
        '<p class="footer-tel"><a href="tel:{PHONE_E164}"><span data-site="PHONE_DISPLAY"></span></a></p>',
    )
    text = text.replace(
        '<a class="cmn--btn" href="tel:+78001234568"><span>Позвонить</span></a>',
        '<a class="cmn--btn" href="tel:{PHONE_E164}"><span>Позвонить</span></a>',
    )
    text = text.replace("© МАСТЕР.РФ ·", "© <span data-site=\"BRAND_SHORT\"></span> ·")
    text = text.replace("| МАСТЕР.РФ", "| {BRAND_SHORT}")
    text = text.replace('"name": "МАСТЕР.РФ"', '"name": "{BRAND_SHORT}"')
    return text


def process_file(path: Path) -> bool:
    rel = str(path.relative_to(ROOT))
    text = path.read_text(encoding="utf-8")
    orig = text

    text = patch_scripts_block(text, 1)
    text = base_url_replacements(text)
    text = patch_common_phone_logo(text)

    if "vskrytie-kvartir" in rel:
        text = text.replace('"price": "1500"', '"price": "{PRICE_KVARTIRA}"')
    elif "vskrytie-avto" in rel:
        text = text.replace('"price": "1500"', '"price": "{PRICE_AVTO}"')
    elif "vskrytie-seifov" in rel:
        text = text.replace('"price": "2500"', '"price": "{PRICE_SEIF}"')
    elif "vskrytie-ofisov" in rel:
        text = text.replace('"price": "2000"', '"price": "{PRICE_OFIS}"')

    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    n = 0
    for path in sorted(ROOT.glob("uslugi/*.html")) + sorted(ROOT.glob("geo/*.html")):
        if process_file(path):
            n += 1
    print("Изменено файлов:", n)


if __name__ == "__main__":
    main()
