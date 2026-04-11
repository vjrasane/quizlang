const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const routes = {
  base,
  index: `${base}/`,
  play: (id: string) => `${base}/play/${id}`,
} as const;
