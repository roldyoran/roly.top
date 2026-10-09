import { ui, defaultLang } from "./ui";

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export type TranslationKey = keyof (typeof ui)[typeof defaultLang];

export function useTranslations(lang: keyof typeof ui) {
  const localizedUI: Record<string, string> = ui[lang];
  return function t(key: TranslationKey) {
    return key in localizedUI ? localizedUI[key] : ui[defaultLang][key];
  };
}
