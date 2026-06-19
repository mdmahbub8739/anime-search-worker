# Anime Search Worker

Multi-source anime/cartoon embed resolver — Cloudflare Worker.

## Deploy from GitHub (Cloudflare Dashboard)

1. **GitHub এ Upload করুন**
   - এই repo fork করুন বা নতুন repo বানিয়ে সব ফাইল upload করুন

2. **Cloudflare Dashboard এ যান**
   - [dash.cloudflare.com](https://dash.cloudflare.com) → Login
   - **Workers & Pages** → **Create Application** → **Pages**
   - **Connect to Git** → GitHub repo select করুন

3. **Build Settings**
   - Framework: `None`
   - Build command: `npm install && npm run deploy` *(Workers হলে এটা skip)*

   **অথবা সরাসরি Worker হিসেবে:**
   - **Workers & Pages** → **Create Application** → **Create Worker**
   - **Import from GitHub** option থাকলে সেটা use করুন
   - না থাকলে: wrangler CLI দিয়ে `npx wrangler deploy`

## API Usage

```
GET https://anime-search.<your-subdomain>.workers.dev/search?q=Doraemon
```

### Response
```json
{
  "query": "Doraemon",
  "sources": [
    {
      "source": "Toonstream",
      "title": "Doraemon",
      "url": "https://toonstream.vip/...",
      "score": 100,
      "embeds": [
        { "server": "Server 1", "url": "https://streamwish.com/..." }
      ]
    }
  ]
}
```

## Sources
- Toonstream
- Animesalt
- AnimeDubHindi
- ToonHub4u
- AnimeDekho
