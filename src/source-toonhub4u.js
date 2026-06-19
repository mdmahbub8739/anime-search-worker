import { safeFetchText } from "./sources.js";

const BASE = "https://toonhub4u.co";

async function searchToonhub4u(query) {
  const html = await safeFetchText(`${BASE}/?s=${encodeURIComponent(query)}`);
  if (!html) return [];
  const results = [];
  const items = html.split(/<li class=["']post-item/i).slice(1);
  for (const block of items) {
    const hrefMatch = block.match(/<a[^>]+href=["']([^"']+)["']/i);
    const titleMatch = block.match(/<a[^>]*>([^<]+)<\/a>/i);
    if (hrefMatch && titleMatch) {
      results.push({
        source: "ToonHub4u",
        title: titleMatch[1].trim().split("[")[0].trim(),
        url: hrefMatch[1],
      });
    }
  }
  return results;
}

async function resolveToonhub4uEmbeds(pageUrl) {
  const html = await safeFetchText(pageUrl);
  if (!html) return [];
  const toggleBlock = html.match(/<div[^>]+class=["'][^"']*mks_toggle_content[^"']*["'][\s\S]*?<\/div>/i);
  const out = [];
  if (toggleBlock) {
    const linkRe = /<a[^>]+href=["']([^"']+)["']/gi;
    let m;
    let i = 0;
    while ((m = linkRe.exec(toggleBlock[0])) !== null) {
      const url = m[1].replace("/file/", "/embed/");
      out.push({ server: `Server ${++i}`, url });
    }
  }
  return out;
}

export { searchToonhub4u, resolveToonhub4uEmbeds };
