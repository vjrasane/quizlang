import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TavilySearch } from "@langchain/tavily";

export const searchWeb = new TavilySearch({ maxResults: 5 });

export const fetchWeb = tool(
  async ({ url }) => {
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    return docs.map((d) => d.pageContent).join("\n").slice(0, 50000);
  },
  {
    name: "fetch_web",
    description:
      "Fetch a web page and extract its text content. Use when the source instructs you to get data from a URL.",
    schema: z.object({
      url: z.string().describe("The URL to fetch"),
    }),
  },
);

export const fetchYoutubeTranscript = tool(
  async ({ url }) => {
    const loader = YoutubeLoader.createFromUrl(url, { addVideoInfo: true });
    const docs = await loader.load();
    return docs.map((d) => d.pageContent).join("\n");
  },
  {
    name: "fetch_youtube_transcript",
    description:
      "Fetch the transcript of a YouTube video. Use when the source references a YouTube URL.",
    schema: z.object({
      url: z.string().describe("The YouTube video URL"),
    }),
  },
);

export const readPdf = tool(
  async ({ path }) => {
    const loader = new PDFLoader(path);
    const docs = await loader.load();
    return docs.map((d) => d.pageContent).join("\n");
  },
  {
    name: "read_pdf",
    description:
      "Read and extract text from a PDF file. Use when the source file is a PDF.",
    schema: z.object({
      path: z.string().describe("Path to the PDF file"),
    }),
  },
);
