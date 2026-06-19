import { safeFetchText, allIframes, firstIframeSrc } from "./sources.js";

const BASE = "https://toonstream.vip";

async function searchToonstream(query) {
  const results = [];
  for (let page = 1; page <= 3; page++) {
    const html = await safeFetchText(`${BASE}/page/${page}/?s=${encodeURIComponent(query)}`);
    if (!html) break;
    const articles = html.split(/<article/i).slice(1);
    let foundOnPage = 0;
    for (const block of articles) {
      const hrefMatch = block.match(/<a[^>]+href=["']([^"']+)["']/i);
      const titleMatch = block.match(/<h2[^>]*>([^<]+)<\/h2>/i);
      if (hrefMatch && titleMatch) {
        results.push({
          source: "Toonstream",
          title: titleMatch[1].trim().replace(/Watch Online/i, "").trim(),
          url: hrefMatch[1],
        });
        foundOnPage++;
      }
    }
    if (foundOnPage === 0) break;
  }
  return results;
}

async function resolveToonstreamEmbeds(pageUrl) {
  const html = await safeFetchText(pageUrl);
  if (!html) return [];
  const layer0 = allIframes(html).filter((u) => u.includes("trembed="));
  const seen = new Set();
  const out = [];
  await Promise.allSettled(
    layer0.map(async (wrapperUrl) => {
      const fullWrapperUrl = wrapperUrl.startsWith("http") ? wrapperUrl : `${BASE}${wrapperUrl}`;
      const wrapperHtml = await safeFetchText(fullWrapperUrl);
      const realSrc = firstIframeSrc(wrapperHtml);
      if (realSrc && !seen.has(realSrc)) {
        seen.add(realSrc);
        const idxMatch = wrapperUrl.match(/trembed=(\d+)/);
        out.push({
          server: `Server ${idxMatch ? Number(idxMatch[1]) + 1 : out.length + 1}`,
          url: realSrc,
        });
      }
    })
  );
  return out;
}

export { searchToonstream, resolveToonstreamEmbeds };
