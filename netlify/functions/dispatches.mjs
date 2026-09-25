// Fetches the latest posts from Melanie, Out of Office on Substack
// and returns them as JSON for the Recent Dispatches section.
// Lives at: /api/dispatches

const FEED_URL = "https://melanieoutofoffice.substack.com/feed";
const MAX_POSTS = 6;

const decode = (str = "") =>
  str
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .trim();

const stripTags = (html = "") =>
  html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
};

const trimTo = (text, max) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…";
};

export function parseFeed(xml) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return items.slice(0, MAX_POSTS).map((item) => {
    const title = tag(item, "title");
    const link = tag(item, "link");
    const date = tag(item, "pubDate");
    const subtitle = stripTags(tag(item, "description"));
    const body = stripTags(tag(item, "content:encoded"));
    const enclosure = item.match(/<enclosure[^>]*url="([^"]+)"/i);
    const firstImg = tag(item, "content:encoded").match(/<img[^>]*src="([^"]+)"/i);
    return {
      title,
      link,
      date: date ? new Date(date).toISOString() : null,
      blurb: trimTo(subtitle || body, 240),
      image: enclosure ? decode(enclosure[1]) : firstImg ? decode(firstImg[1]) : null,
    };
  });
}

export default async () => {
  try {
    const res = await fetch(FEED_URL, {
      headers: { "User-Agent": "melanieoutofoffice.com dispatch feed" },
    });
    if (!res.ok) throw new Error(`Feed returned ${res.status}`);
    const posts = parseFeed(await res.text());
    return new Response(JSON.stringify({ posts }), {
      headers: {
        "Content-Type": "application/json",
        // Browsers keep it 5 minutes; Netlify's CDN keeps it 15 and refreshes in the background.
        "Cache-Control": "public, max-age=300",
        "Netlify-CDN-Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ posts: [], error: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};

export const config = { path: "/api/dispatches" };
