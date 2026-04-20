import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection("quizzes");
  return entries.map((entry) => ({
    params: { id: entry.id },
    props: { quiz: entry.data },
  }));
};

export const GET: APIRoute = ({ props }) => {
  return new Response(JSON.stringify(props.quiz), {
    headers: { "Content-Type": "application/json" },
  });
};
