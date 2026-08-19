import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "..", "locales");

// Keep in sync with the <option> values in views/settings.ejs,
// views/auth/register.ejs, and views/editor.ejs - these are the only
// content/UI languages the app knows about.
export const SUPPORTED_LANGUAGES = ["en", "ru", "cn"];
const FALLBACK_LANGUAGE = "en";

// Only "en" is fully populated right now - ru.json/cn.json exist so the
// language selector and this loader don't need special-casing later, but
// every lookup currently falls back to the English string underneath.
export const dictionaries = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((lang) => [lang, JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), "utf8"))]),
);

const interpolate = (str, vars) => {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
};

// Falls back to English, then to the raw key itself, so a missing
// translation shows up as visibly wrong text instead of a blank string.
export const translate = (lang, key, vars) => {
  const dict = dictionaries[lang] || dictionaries[FALLBACK_LANGUAGE];
  const str = dict[key] ?? dictionaries[FALLBACK_LANGUAGE][key] ?? key;
  return interpolate(str, vars);
};
