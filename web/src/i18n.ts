import { useState, useEffect, useCallback, createContext, useContext } from "react";

export type Locale = "en" | "fi";

const STORAGE_KEY = "quizlang-locale";
const EVENT_NAME = "locale-change";

const translations: Record<string, Record<Locale, string>> = {
  loading: { en: "Loading...", fi: "Ladataan..." },
  percentCorrect: { en: "% correct", fi: "% oikein" },
  tryAgain: { en: "Try again", fi: "Yritä uudelleen" },
  allQuizzes: { en: "All quizzes", fi: "Kaikki visat" },
  seeResults: { en: "See results", fi: "Katso tulokset" },
  next: { en: "Next", fi: "Seuraava" },
  submit: { en: "Submit", fi: "Vastaa" },
  typeYourAnswer: { en: "Type your answer...", fi: "Kirjoita vastauksesi..." },
  correctAnswer: { en: "Correct answer:", fi: "Oikea vastaus:" },
  items: { en: "Items", fi: "Kohteet" },
  allItemsAssigned: {
    en: "All items assigned",
    fi: "Kaikki kohteet sijoitettu",
  },
  quizzes: { en: "Quizzes", fi: "Tietovisat" },
  nQuestions: { en: "{n} questions", fi: "{n} kysymystä" },
  questionCounter: { en: "Question", fi: "Kysymys" },
};

export function t(
  key: string,
  locale: Locale,
  params?: Record<string, string | number>,
): string {
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[locale] ?? entry.en ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

function isLocale(val: unknown): val is Locale {
  return val === "en" || val === "fi";
}

function getStoredLocale(): Locale | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (isLocale(val)) return val;
  } catch {}
  return null;
}

function getBrowserLocale(): Locale | null {
  try {
    const lang = navigator.language.split("-")[0];
    if (isLocale(lang)) return lang;
  } catch {}
  return null;
}

const LocaleOverrideContext = createContext<Locale | null>(null);
export const LocaleOverrideProvider = LocaleOverrideContext.Provider;

export function useLocale() {
  const override = useContext(LocaleOverrideContext);

  const [siteLocale, setSiteLocaleState] = useState<Locale>(
    () => getStoredLocale() ?? getBrowserLocale() ?? "en",
  );

  const setLocale = useCallback((next: Locale) => {
    setSiteLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  }, []);

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored && stored !== siteLocale) setSiteLocaleState(stored);

    const handler = (e: Event) => {
      const next = (e as CustomEvent<Locale>).detail;
      if (next === "en" || next === "fi") setSiteLocaleState(next);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const locale = override ?? siteLocale;

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      t(key, locale, params),
    [locale],
  );

  return { locale, setLocale, t: translate };
}
