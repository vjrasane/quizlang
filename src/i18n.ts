import { useCallback, useMemo } from "react";
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

const translations: Record<Locale, Translations> = { en, fi };

export function translateWith(locale: Locale) {
  const ts = translations[locale];
  return function (
    key: TranslationKey,
    params?: Record<string, string | number>,
  ): string {
    let text = ts[key];
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

function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
}

function localeFromPathname(): Locale | undefined {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const seg = window.location.pathname
    .slice(base.length)
    .split("/")
    .filter(Boolean)[0];
  return isLocale(seg) ? seg : undefined;
}

export function useLocale(locale: Locale) {
  const translate = useCallback(translateWith(locale), [locale]);

  const handleSetLocale = useCallback(
    (next: Locale) => {
      storeLocale(next);
      window.location.pathname = window.location.pathname.replace(
        `/${locale}`,
        `/${next}`,
      );
    },
    [locale],
  );

  return { t: translate, locale, setLocale: handleSetLocale };
}

export function usePageLocale() {
  const locale = localeFromPathname();
  return useLocale(locale ?? defaultLocale);
}
