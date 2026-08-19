// Client-side counterpart to tools/i18n.js. window.I18N (every language's
// full dictionary) is embedded once per page by partials/common.ejs, the
// same way window.APP ships task/answer data - so switching languages
// client-side never needs a round trip to the server.
const FALLBACK_LANGUAGE = "en";

const interpolate = (str, vars) => {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
};

export const t = (key, vars) => {
    const dictionaries = window.I18N || {};
    const lang = sessionStorage.getItem("language") || FALLBACK_LANGUAGE;
    const dict = dictionaries[lang] || dictionaries[FALLBACK_LANGUAGE] || {};
    const fallbackDict = dictionaries[FALLBACK_LANGUAGE] || {};
    const str = dict[key] ?? fallbackDict[key] ?? key;
    return interpolate(str, vars);
};

// Swaps text (and input placeholders) for every element tagged with
// data-i18n / data-i18n-placeholder to match the current language. Called
// once on load and again on "app:languagechange" - the same two-step
// pattern already used to re-filter tasks/answers by language.
export const applyTranslations = (root = document) => {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
        // data-i18n-vars carries interpolation values for strings that
        // need them (e.g. "Welcome to {title}!") - JSON since a plain
        // data attribute can only ever be a string, and the value itself
        // is set server-side, never user input, so this is trusted.
        const vars = el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : undefined;
        el.textContent = t(el.dataset.i18n, vars);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
};
