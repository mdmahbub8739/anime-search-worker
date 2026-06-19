import { safeFetchText, allIframes } from "./sources.js";

const BASE = "https://animesalt.ac";

async function searchAnimesalt(query) {
  const body = new URLSearchParams({
    action: "torofilm_infinite_scroll",
    page: "1",
    per_page: "12",
    query_type: "search",
    "query_args[s]": query,
  });
  const raw = await safeFetchText(`${BASE}/wp-admin/admin-ajax.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!raw) return [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch (_) { return []; }
  const html = parsed?.data?.content;
  if (!html) return [];
  const results = [];
  const articles = html.split(/<article/i).slice(1);
  for (const block of articles) {
    const hrefMatch = block.match(/<a[^>]+href=["']([^"']+)["']/i);
    const titleMatch = block.match(/<h2[^>]*>([^<]+)<\/h2>/i);
    if (hrefMatch && titleMatch) {
      results.push({ source: "Animesalt", title: titleMatch[1].trim(), url: hrefMatch[1] });
    }
  }
  return results;
}

async function resolveAnimesaltEmbeds(pageUrl) {
  let targetUrl = pageUrl;
  const seriesHtml = await safeFetchText(pageUrl);
  if (seriesHtml && pageUrl.includes("/series/")) {
    const firstEp = seriesHtml.match(/<a href=["']([^"']+\/episode\/[^"']+)["'][^>]*class=["']smart-play-btn btn-first/i);
    if (firstEp) targetUrl = firstEp[1];
  }
  const html = targetUrl === pageUrl ? seriesHtml : await safeFetchText(targetUrl);
  if (!html) return [];
  const iframes = allIframes(html);
  return iframes.map((src, i) => ({ server: `Server ${i + 1}`, url: src }));
}

export { searchAnimesalt, resolveAnimesaltEmbeds };
