const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const routes = {
  base,
  index: `${base}/`,
  list: `${base}/list`,
  listWithLocale: (locale: string) => `${base}/${locale}/list`,
  play: (id: string) => `${base}/play/${id}`,
  playWithLocale: (id: string, locale: string) =>
    `${base}/${locale}/play/${id}`,
} as const;
