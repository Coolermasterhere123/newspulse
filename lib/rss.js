import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

/**
 * Fetch and parse a Google News RSS search feed.
 * No API key required — this is a public RSS endpoint.
 */
export async function fetchGoogleNewsRSS(query, { lang = "en-CA", geo = "CA", limit = 12 } = {}) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=${lang}&gl=${geo}&ceid=${geo}:${lang.split("-")[0]}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsPulse/1.0)" },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

  const xml = await res.text();
  const data = parser.parse(xml);
  const items = data?.rss?.channel?.item || [];
  const arr = Array.isArray(items) ? items : [items];

  return arr.slice(0, limit).map((item) => {
    // Google News titles are usually "Headline - Source"
    const rawTitle = String(item.title || "").trim();
    const lastDash = rawTitle.lastIndexOf(" - ");
    const title = lastDash > -1 ? rawTitle.slice(0, lastDash) : rawTitle;
    const source =
      item.source?.["#text"] || (lastDash > -1 ? rawTitle.slice(lastDash + 3) : "");

    return {
      title,
      source,
      link: item.link,
      pubDate: item.pubDate,
    };
  });
}
