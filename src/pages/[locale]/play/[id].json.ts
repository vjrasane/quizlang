import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { locales } from "@/src/i18n";

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection("quizzes");
  return locales.flatMap((locale) =>
    entries.map((entry) => ({
      params: { locale, id: entry.id },
      props: { quiz: entry.data },
    })),
  );
};

export const GET: APIRoute = ({ props }) => {
  return new Response(JSON.stringify(props.quiz), {
    headers: { "Content-Type": "application/json" },
  });
};
