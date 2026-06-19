import { safeFetchText, extractAll, firstIframeSrc } from "./sources.js";

const BASE = "https://animedekho.app";

async function searchAnimedekho(query) {
  const html = await safeFetchText(`${BASE}/?s=${encodeURIComponent(query)}`);
  if (!html) return [];
  const results = [];
  const articles = html.split(/<article/i).slice(1);
  for (const block of articles) {
    const hrefMatch = block.match(/<a[^>]+class=["']lnk-blk["'][^>]+href=["']([^"']+)["']/i);
    const titleMatch = block.match(/<header[^>]*>\s*<h2[^>]*>([^<]+)<\/h2>/i);
    if (hrefMatch && titleMatch) {
      results.push({ source: "AnimeDekho", title: titleMatch[1].trim(), url: hrefMatch[1] });
    }
  }
  return results;
}

async function resolveAnimedekhoEmbeds(pageUrl) {
  const out = [];
  const seen = new Set();

  const html1 = await safeFetchText(pageUrl, { headers: { Cookie: "toronites_server=vidstream" } });
  if (html1) {
    const serverIframes = extractAll(html1, '<iframe[^>]+class=["\'][^"\']*serversel[^"\']*["\'][^>]+src=["\']([^"\']+)["\']');
    await Promise.allSettled(
      serverIframes.map(async (m) => {
        const wrapperUrl = m[1];
        const wrapperHtml = await safeFetchText(wrapperUrl);
        const realSrc = firstIframeSrc(wrapperHtml);
        if (realSrc && !seen.has(realSrc)) {
          seen.add(realSrc);
          out.push({ server: `VidStream ${out.length + 1}`, url: realSrc });
        }
      })
    );
  }

  const bodyClassMatch = html1 ? html1.match(/<body[^>]+class=["']([^"']+)["']/i) : null;
  const termMatch = bodyClassMatch ? bodyClassMatch[1].match(/(?:term|postid)-(\d+)/) : null;
  if (termMatch) {
    const postId = termMatch[1];
    const mediaType = pageUrl.includes("/movie/") ? 1 : 2;
    const indices = Array.from({ length: 11 }, (_, i) => i);
    await Promise.allSettled(
      indices.map(async (i) => {
        const wrapperHtml = await safeFetchText(`${BASE}/?trdekho=${i}&trid=${postId}&trtype=${mediaType}`);
        const realSrc = firstIframeSrc(wrapperHtml);
        if (realSrc && !seen.has(realSrc)) {
          seen.add(realSrc);
          out.push({ server: `Server ${i + 1}`, url: realSrc });
        }
      })
    );
  }

  return out;
}

export { searchAnimedekho, resolveAnimedekhoEmbeds };
