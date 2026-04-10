import type { APIRoute, GetStaticPaths } from "astro";
import fs from "node:fs";
import path from "node:path";

function getDataDir() {
  return path.resolve("data");
}

export const getStaticPaths: GetStaticPaths = () => {
  const dataDir = getDataDir();
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));
  return files.map((file) => ({
    params: { id: file.replace(/\.json$/, "") },
  }));
};

export const GET: APIRoute = ({ params }) => {
  const filePath = path.join(getDataDir(), `${params.id}.json`);
  const data = fs.readFileSync(filePath, "utf-8");
  return new Response(data, {
    headers: { "Content-Type": "application/json" },
  });
};
