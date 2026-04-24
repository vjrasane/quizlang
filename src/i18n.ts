import { useCallback, createContext, useContext } from "react";
import { Locale } from "./types/quiz";
export type { Locale } from "./types/quiz";

export const defaultLocale: Locale = "fi";
export const locales = Locale.options;

const STORAGE_KEY = "quizlang-locale";

const en = {
  loading: "Loading...",
  percentCorrect: "% correct",
  tryAgain: "Try again",
  allQuizzes: "All quizzes",
  seeResults: "See results",
  next: "Next",
  submit: "Submit",
  typeYourAnswer: "Type your answer...",
  correctAnswer: "Correct answer:",
  items: "Items",
  allItemsAssigned: "All items assigned",
  quizzes: "Quizzes",
  nQuestions: "{n} questions",
  questionCounter: "Question",
  reset: "Reset",
  incorrectQuestions: "Incorrect answers",
  wrongTryAgain: "Incorrect — try again!",
  goBack: "Back",
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = Record<TranslationKey, string>;

const fi: Translations = {
  loading: "Ladataan...",
  percentCorrect: "% oikein",
  tryAgain: "Yritä uudelleen",
  allQuizzes: "Kaikki visat",
  seeResults: "Katso tulokset",
  next: "Seuraava",
  submit: "Vastaa",
  typeYourAnswer: "Kirjoita vastauksesi...",
  correctAnswer: "Oikea vastaus:",
  items: "Kohteet",
  allItemsAssigned: "Kaikki kohteet sijoitettu",
  quizzes: "Tietovisat",
  nQuestions: "{n} kysymystä",
  questionCounter: "Kysymys",
  reset: "Aloita alusta",
  incorrectQuestions: "Väärät vastaukset",
  wrongTryAgain: "Väärin — yritä uudelleen!",
  goBack: "Edellinen",
};

export const translations: Record<Locale, Translations> = { en, fi };

export function translateWith(translations: Translations) {
  return function (
    key: TranslationKey,
    params?: Record<string, string | number>,
  ): string {
    let text = translations[key];
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };
}

export function isLocale(val: unknown): val is Locale {
  return Locale.safeParse(val).success;
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

/** Preferred locale for redirects: stored > browser > default. */
export function getPreferredLocale(): Locale {
  return getStoredLocale() ?? getBrowserLocale() ?? defaultLocale;
}

export const TranslationsContext = createContext<Translations>(en);

export function useLocale() {
  const ts = useContext(TranslationsContext);

  const translate = useCallback(translateWith(ts), [ts]);

  return { t: translate };
}
