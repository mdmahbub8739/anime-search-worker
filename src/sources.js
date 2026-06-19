const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function safeFetchText(url, opts = {}) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, ...(opts.headers || {}) },
      method: opts.method || "GET",
      body: opts.body,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (_) {
    return null;
  }
}

function extractAll(html, regex) {
  const out = [];
  let m;
  const re = new RegExp(regex, "g");
  while ((m = re.exec(html)) !== null) out.push(m);
  return out;
}

function firstIframeSrc(html) {
  if (!html) return null;
  const dataSrc = html.match(/<iframe[^>]+data-src=["']([^"']+)["']/i);
  if (dataSrc) return dataSrc[1];
  const src = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return src ? src[1] : null;
}

function allIframes(html) {
  if (!html) return [];
  const matches = extractAll(html, '<iframe[^>]*(?:data-src|src)=["\']([^"\']+)["\']');
  return matches.map((m) => m[1]);
}

function normalizeTitle(t) {
  return t
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/season \d+|s\d+|episode \d+|e\d+/gi, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function titleScore(query, candidate) {
  const q = normalizeTitle(query);
  const c = normalizeTitle(candidate);
  if (!q || !c) return 0;
  if (c === q) return 100;
  if (c.includes(q)) return 80;
  if (q.includes(c)) return 70;
  const qTok = new Set(q.split(" "));
  const cTok = new Set(c.split(" "));
  let overlap = 0;
  qTok.forEach((tok) => { if (cTok.has(tok)) overlap++; });
  return Math.round((overlap / Math.max(qTok.size, 1)) * 60);
}

function pickBest(query, results) {
  if (!results.length) return null;
  let best = results[0];
  let bestScore = -1;
  for (const r of results) {
    const s = titleScore(query, r.title);
    if (s > bestScore) { bestScore = s; best = r; }
  }
  return bestScore > 0 ? { ...best, score: bestScore } : null;
}

export { safeFetchText, extractAll, firstIframeSrc, allIframes, normalizeTitle, titleScore, pickBest, UA };
