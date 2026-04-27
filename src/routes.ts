import { useMemo } from "react";
import { usePageLocale, type Locale } from "./i18n";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const routesWithLocale = (locale: Locale) => {
  const basePath = `${base}/${locale}`;
  return {
    index: basePath,
    list: `${basePath}/play`,
    play: (id: string) => `${basePath}/play/${id}/`,
  };
};

export const useRoutes = () => {
  const { locale } = usePageLocale();
  const routes = useMemo(() => routesWithLocale(locale), [locale]);
  return routes;
};
