import { HtmlBasePlugin } from "@11ty/eleventy";
import markdownIt from "markdown-it";
import i18n from "./src/_data/i18n.js";

const md = markdownIt({ html: true, linkify: true, typographer: true });

const LOCALES = { uk: "uk-UA", en: "en-GB" };

export default function (eleventyConfig) {
  // GitHub Pages без власного домену: PATH_PREFIX=/назва-репозиторію/
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ media: "media" });
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });
  eleventyConfig.addWatchTarget("content/");

  // Рядок інтерфейсу: {{ "nav.about" | t(lang) }}
  eleventyConfig.addFilter("t", (key, lang) => {
    const entry = key.split(".").reduce((o, k) => (o ? o[k] : undefined), i18n);
    if (!entry) return key;
    return entry[lang] ?? entry.uk ?? key;
  });

  // Двомовне поле: {{ item.title | L(lang) }} — якщо англійської немає, показує українську
  eleventyConfig.addFilter("L", (obj, lang) => {
    if (obj == null) return "";
    if (typeof obj !== "object") return obj;
    const v = obj[lang];
    return v && String(v).trim() ? v : obj.uk ?? "";
  });

  eleventyConfig.addFilter("md", (s) => (s ? md.render(String(s)) : ""));
  eleventyConfig.addFilter("mdInline", (s) => (s ? md.renderInline(String(s)) : ""));

  eleventyConfig.addFilter("fdate", (iso, lang, tentative) => {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00Z");
    const opts = tentative
      ? { month: "long", year: "numeric", timeZone: "UTC" }
      : { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };
    let s = new Intl.DateTimeFormat(LOCALES[lang] || "uk-UA", opts).format(d);
    if (tentative && lang === "uk") s = s.replace(/\s*р\.$/, "");
    return s;
  });

  eleventyConfig.addFilter("dayNum", (iso) => (iso ? String(Number(iso.slice(8, 10))) : ""));
  eleventyConfig.addFilter("monthShort", (iso, lang) => {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00Z");
    return new Intl.DateTimeFormat(LOCALES[lang] || "uk-UA", { month: "short", timeZone: "UTC" })
      .format(d)
      .replace(".", "");
  });
  eleventyConfig.addFilter("year", (iso) => (iso ? iso.slice(0, 4) : ""));

  eleventyConfig.addFilter("otherLang", (lang) => (lang === "uk" ? "en" : "uk"));
  eleventyConfig.addFilter("swapLang", (url, lang) => {
    const other = lang === "uk" ? "en" : "uk";
    return url.replace(new RegExp("^/" + lang + "/"), "/" + other + "/");
  });

  eleventyConfig.addFilter("where", (arr, key, value) =>
    (arr || []).filter((x) => key.split(".").reduce((o, k) => (o ? o[k] : undefined), x) === value)
  );
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("fileExt", (p) => (p ? String(p).split(".").pop().toUpperCase() : ""));
  eleventyConfig.addFilter("range", (n) => Array.from({ length: Number(n) || 0 }, (_, i) => i));
  eleventyConfig.addFilter("percent", (a, b) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    templateFormats: ["njk", "11ty.js"],
    htmlTemplateEngine: "njk",
  };
}
