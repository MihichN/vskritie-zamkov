/**
 * Пишет в корень проекта robots.txt и sitemap.xml.
 * Домен берётся из js/config.js (site.url).
 * Запуск: node scripts/generate-sitemap.mjs
 * Обычно после добавления страниц или смены URL в конфиге.
 */
import fs from "fs";
import path from "path";
import vm from "node:vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadZamokSiteConfig() {
  const code = fs.readFileSync(path.join(ROOT, "js", "config.js"), "utf8");
  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  if (!sandbox.ZAMOK_SITE_CONFIG)
    throw new Error("Не найден ZAMOK_SITE_CONFIG в js/config.js");
  return sandbox.ZAMOK_SITE_CONFIG;
}

function escXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/** @typedef {{ loc: string, lastmod?: string }} Entry */

function isoMtime(absPath) {
  try {
    return fs.statSync(absPath).mtime.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

/** @returns {Entry[]} */
function collectEntries() {
  /** @type {Entry[]} */
  const list = [];

  function pushHref(hrefPath, diskPath) {
    const lm = isoMtime(diskPath);
    list.push({
      loc: hrefPath.endsWith("/") ? hrefPath : hrefPath.replace(/\/+$/, "") || "/",
      lastmod: lm,
    });
  }

  pushHref("/", path.join(ROOT, "index.html"));

  for (const sub of ["uslugi", "geo"]) {
    const dir = path.join(ROOT, sub);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".html")) continue;
      const file = path.join(dir, name);
      if (!fs.statSync(file).isFile()) continue;
      const href =
        name === "index.html"
          ? `/${sub}/`
          : `/${sub}/${name.replace(/\.html$/, "")}.html`;
      pushHref(href, file);
    }
  }

  const seen = new Set();
  return list.filter((e) => {
    if (seen.has(e.loc)) return false;
    seen.add(e.loc);
    return true;
  });
}

function main() {
  const Z = loadZamokSiteConfig();
  const origin = Z.site.url.replace(/\/+$/, "");
  const entries = collectEntries().sort((a, b) => a.loc.localeCompare(b.loc));

  const robots = `User-agent: *
Allow: /

# Укажите при необходимости отдельные правила для тестовых поддоменов.
# Host: ${origin.replace(/^https?:\/\//, "")}

Sitemap: ${origin}/sitemap.xml
`;
  fs.writeFileSync(path.join(ROOT, "robots.txt"), robots, "utf8");

  const urlset = entries
    .map((e) => {
      const full = origin + (e.loc === "/" ? "/" : e.loc);
      const lm = e.lastmod ? `\n    <lastmod>${escXml(e.lastmod)}</lastmod>` : "";
      return `  <url>
    <loc>${escXml(full)}</loc>${lm}
    <changefreq>weekly</changefreq>
    <priority>${e.loc === "/" ? "1.0" : e.loc.endsWith("/") && e.loc !== "/" ? "0.85" : "0.8"}</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");

  console.log(
    `OK: robots.txt и sitemap.xml (${entries.length} URL, база ${origin}).`
  );
}

main();
