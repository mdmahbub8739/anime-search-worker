import { pickBest } from "./sources.js";
import { searchToonstream, resolveToonstreamEmbeds } from "./source-toonstream.js";
import { searchAnimesalt, resolveAnimesaltEmbeds } from "./source-animesalt.js";
import { searchAnimedubhindi, resolveAnimedubhindiEmbeds } from "./source-animedubhindi.js";
import { searchToonhub4u, resolveToonhub4uEmbeds } from "./source-toonhub4u.js";
import { searchAnimedekho, resolveAnimedekhoEmbeds } from "./source-animedekho.js";

const SOURCES = [
  { name: "Toonstream",    search: searchToonstream,    resolve: resolveToonstreamEmbeds },
  { name: "Animesalt",     search: searchAnimesalt,     resolve: resolveAnimesaltEmbeds },
  { name: "AnimeDubHindi", search: searchAnimedubhindi, resolve: resolveAnimedubhindiEmbeds },
  { name: "ToonHub4u",     search: searchToonhub4u,     resolve: resolveToonhub4uEmbeds },
  { name: "AnimeDekho",    search: searchAnimedekho,    resolve: resolveAnimedekhoEmbeds },
];

async function searchAllSources(query) {
  const searchSettled = await Promise.allSettled(
    SOURCES.map(async (src) => {
      const results = await src.search(query);
      return { source: src.name, results };
    })
  );

  const matched = [];
  for (const settled of searchSettled) {
    if (settled.status !== "fulfilled") continue;
    const { source, results } = settled.value;
    const best = pickBest(query, results);
    if (best) matched.push({ source, ...best });
  }

  if (matched.length === 0) {
    return { query, sources: [], note: "No matches found on any source." };
  }

  const sourceMap = Object.fromEntries(SOURCES.map((s) => [s.name, s]));
  const resolveSettled = await Promise.allSettled(
    matched.map(async (m) => {
      const src = sourceMap[m.source];
      const embeds = await src.resolve(m.url);
      return { ...m, embeds };
    })
  );

  const sources = resolveSettled
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((r) => r.embeds && r.embeds.length > 0)
    .sort((a, b) => b.score - a.score);

  return { query, sources };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
      });
    }

    if (url.pathname === "/search") {
      const query = url.searchParams.get("q");
      if (!query) return json({ error: "missing ?q=" }, 400);
      return json(await searchAllSources(query));
    }

    return json({ error: "use /search?q=<title>" }, 404);
  },
};
