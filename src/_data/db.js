// Читає файли, які редагуються через Pages CMS (папка content/),
// і готує їх для шаблонів. Редагувати цей файл команді не потрібно.
import fs from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";

const ROOT = path.resolve("content");
const LANGS = ["uk", "en"];

function isoDate(v) {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readYaml(file) {
  try {
    return loadYaml(fs.readFileSync(file, "utf8")) || {};
  } catch (e) {
    console.warn(`[content] Не вдалося прочитати ${file}: ${e.message}`);
    return null;
  }
}

function readCollection(name) {
  const dir = path.join(ROOT, name);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => {
      const data = readYaml(path.join(dir, f));
      if (!data) return null;
      const base = f.replace(/\.ya?ml$/, "");
      return { ...data, slug: slugify(data.url) || slugify(base) || base, date: isoDate(data.date) };
    })
    .filter((x) => x && !x.draft);
}

function readSingle(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? readYaml(p) || {} : {};
}

const perLang = (items) => items.flatMap((item) => LANGS.map((lang) => ({ lang, item })));

export default function () {
  const today = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

  const events = readCollection("events")
    .map((e) => ({ ...e, past: e.date < today }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const news = readCollection("news").sort((a, b) => b.date.localeCompare(a.date));
  const briefs = readCollection("briefs").sort(
    (a, b) => (b.year || 0) - (a.year || 0) || String(a.author).localeCompare(String(b.author))
  );
  const issues = readCollection("issues").sort((a, b) => (b.number || 0) - (a.number || 0));
  const resources = readCollection("resources").sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const team = readCollection("team").sort((a, b) => (a.order || 99) - (b.order || 99));

  const settings = readSingle("settings/site.yml");
  const pages = {};
  for (const name of ["home", "about", "course", "policy-briefs", "events", "resources", "contact", "privacy", "accessibility"]) {
    pages[name] = readSingle(`pages/${name}.yml`);
  }

  const held = (kind) => events.filter((e) => e.kind === kind && e.past).length;
  const targets = settings.targets || {};
  const indicators = {
    students: { value: Number(settings.students_completed) || 0, target: Number(targets.students) || 150 },
    webinars: { value: held("webinar"), target: Number(targets.webinars) || 6 },
    conferences: { value: held("conference"), target: Number(targets.conferences) || 3 },
    participants: {
      value: events.filter((e) => e.past).reduce((s, e) => s + (Number(e.participants) || 0), 0),
      target: Number(targets.participants) || 200,
    },
  };

  const topics = [...new Set(briefs.flatMap((b) => b.topics || []))];
  const years = [...new Set(briefs.map((b) => b.year).filter(Boolean))].sort((a, b) => b - a);

  return {
    today,
    langs: LANGS,
    settings,
    pages,
    events,
    upcoming: events.filter((e) => !e.past),
    pastEvents: [...events.filter((e) => e.past)].reverse(),
    news,
    briefs,
    briefTopics: topics,
    briefYears: years,
    awards: briefs.filter((b) => b.award),
    issues,
    resources,
    team,
    indicators,
    eventPages: perLang(events),
    newsPages: perLang(news),
    simplePages: ["privacy", "accessibility"].flatMap((key) => LANGS.map((lang) => ({ lang, key }))),
  };
}
