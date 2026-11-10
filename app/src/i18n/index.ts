/**
 * Lightweight UI localization for the StarBreaker desktop app.
 *
 * The dictionary is a flat `English source string -> translated string` map
 * (see `zh-CN.json`), so call sites stay readable: `t("Extract all matches…")`
 * and an untranslated string simply falls back to its English source.
 *
 * Placeholders use single braces: `t("{count} files", { count: 12 })`.
 * A key may also carry a `##context` suffix when the same English word needs
 * different translations in different places (`t("Save##verb")`).
 *
 * Usage in a component:
 *
 *   const t = useT();
 *   ...
 *   <button>{t("Extract")}</button>
 *
 * Code that is not a React component (stores, helpers) uses the module-level
 * `t()`; it reads the current language at call time.
 */
import { useCallback, useSyncExternalStore } from "react";
import zhCN from "./zh-CN.json";

export type Language = "en" | "zh-CN";

export interface LanguageInfo {
  id: Language;
  /** Name shown in the language picker, in the language itself. */
  label: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { id: "en", label: "English" },
  { id: "zh-CN", label: "简体中文" },
];

const STORAGE_KEY = "starbreaker.language";

const dictionaries: Record<Language, Record<string, string>> = {
  en: {},
  "zh-CN": zhCN as Record<string, string>,
};

type Vars = Record<string, string | number>;
export type TFunction = (key: string, vars?: Vars) => string;

const listeners = new Set<() => void>();

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "zh-CN";
}

function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // localStorage can be unavailable in a sandboxed webview; fall through.
  }
  const preferred = typeof navigator !== "undefined" ? navigator.language : "";
  return preferred.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

let currentLanguage: Language = detectLanguage();

if (typeof document !== "undefined") {
  document.documentElement.lang = currentLanguage;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setLanguage(language: Language): void {
  if (language === currentLanguage) return;
  currentLanguage = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Persisting the choice is best-effort.
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
  for (const listener of listeners) listener();
}

/** Resolve the dictionary entry for `key`, honouring `##context` suffixes. */
function lookup(dictionary: Record<string, string>, key: string): string | undefined {
  const direct = dictionary[key];
  if (direct !== undefined) return direct;
  const separator = key.indexOf("##");
  if (separator >= 0) return dictionary[key.slice(0, separator)];
  return undefined;
}

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

export function translate(language: Language, key: string, vars?: Vars): string {
  const template = lookup(dictionaries[language], key);
  if (template === undefined) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] missing "${language}" string: ${key}`);
    }
    return interpolate(key, vars);
  }
  return interpolate(template, vars);
}

/** Translate a string that came from the Rust backend. Unknown strings (stage
 *  names the frontend has no entry for) are shown verbatim instead of warning. */
export function translateBackend(language: Language, message: string): string {
  const template = lookup(dictionaries[language], message);
  if (template === undefined) return message;
  return template;
}

export function t(key: string, vars?: Vars): string {
  return translate(currentLanguage, key, vars);
}

/** Translate a backend-provided stage/message; falls back to the original. */
export function tm(message: string): string {
  return translateBackend(currentLanguage, message);
}

/** Subscribe a component to language changes and return its `t`. */
export function useT(): TFunction {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
  return useCallback((key: string, vars?: Vars) => translate(language, key, vars), [language]);
}

/** Subscribe a component to language changes (for language pickers). */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}
