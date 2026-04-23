import { useState, useCallback, createContext, useContext } from "react";

export type Locale = "en" | "fi";

export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "fi"];

const STORAGE_KEY = "quizlang-locale";

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
  reset: { en: "Reset", fi: "Aloita alusta" },
  incorrectQuestions: { en: "Incorrect answers", fi: "Väärät vastaukset" },
  wrongTryAgain: { en: "Incorrect — try again!", fi: "Väärin — yritä uudelleen!" },
  goBack: { en: "Back", fi: "Edellinen" },
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

export function isLocale(val: unknown): val is Locale {
  return val === "en" || val === "fi";
}

export function getStoredLocale(): Locale | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (isLocale(val)) return val;
  } catch {}
  return null;
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
}

function getBrowserLocale(): Locale | null {
  try {
    const lang = navigator.language.split("-")[0];
    if (isLocale(lang)) return lang;
  } catch {}
  return null;
}

function getUrlLocale(): Locale {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname.slice(base.length);
  const segment = path.split("/")[1];
  return isLocale(segment) ? segment : defaultLocale;
}

/** Preferred locale for redirects: stored > browser > default. */
export function getPreferredLocale(): Locale {
  return getStoredLocale() ?? getBrowserLocale() ?? defaultLocale;
}

const LocaleOverrideContext = createContext<Locale | null>(null);
export const LocaleOverrideProvider = LocaleOverrideContext.Provider;

export function useLocale() {
  const override = useContext(LocaleOverrideContext);
  const [urlLocale] = useState(getUrlLocale);

  const setLocale = useCallback((next: Locale) => {
    storeLocale(next);
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const path = window.location.pathname.slice(base.length);
    const rest = path.replace(/^\/[a-z]{2}(\/|$)/, "/");
    window.location.href = `${base}/${next}${rest}`;
  }, []);

  const locale = override ?? urlLocale;

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      t(key, locale, params),
    [locale],
  );

  return { locale, setLocale, t: translate };
}
