import { safeFetchText } from "./sources.js";

const BASE = "https://www.animedubhindi.me";

async function searchAnimedubhindi(query) {
  const html = await safeFetchText(`${BASE}/?s=${encodeURIComponent(query)}`);
  if (!html) return [];
  const results = [];
  const articles = html.split(/<article/i).slice(1);
  for (const block of articles) {
    const hrefMatch = block.match(/<h2[^>]*>\s*<a[^>]+href=["']([^"']+)["']/i);
    const titleMatch = block.match(/<h2[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i);
    if (hrefMatch && titleMatch) {
      results.push({
        source: "AnimeDubHindi",
        title: titleMatch[1].trim().replace(/\(.*?\)\s*$/, "").trim(),
        url: hrefMatch[1],
      });
    }
  }
  return results;
}

async function resolveAnimedubhindiEmbeds(pageUrl) {
  const html = await safeFetchText(pageUrl);
  if (!html) return [];
  const iframeRedirect = html.match(/<div class=["']wp-block-button["']>\s*<a[^>]+href=["']([^"']+)["']/i);
  if (!iframeRedirect) return [];
  const epHtml = await safeFetchText(iframeRedirect[1]);
  if (!epHtml) return [];
  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  const out = [];
  let m;
  while ((m = linkRe.exec(epHtml)) !== null) {
    const [, href, text] = m;
    if (href.includes("hubcloud") || href.includes("gdflix")) {
      out.push({ server: text.trim() || `Server ${out.length + 1}`, url: href });
    }
  }
  return out;
}

export { searchAnimedubhindi, resolveAnimedubhindiEmbeds };
