import { NextResponse } from "next/server";
import { fetchGoogleNewsRSS } from "../../../lib/rss";
import { summarize } from "../../../lib/groq";
import { getNearbyTowns } from "../../../lib/bc-cities";

export const dynamic = "force-dynamic";

const CATEGORIES = {
  canada: { query: "Canada", label: "Canada" },
  usa: { query: '"United States"', label: "USA" },
  world: { query: "world news", label: "World" },
  conflict: {
    query: '"United States" AND (war OR military OR strike OR troops)',
    label: "US Conflict Watch",
  },
  wildfire: {
    query: '(wildfire OR "forest fire") AND (Canada OR "British Columbia" OR BC)',
    label: "Wildfire News",
  },
};

// Only keep headlines that actually mention the place we searched for —
// Google News RSS sometimes loosely matches unrelated BC stories otherwise.
function filterRelevant(items, place) {
  const needle = place.toLowerCase();
  return items.filter((it) => (it.title || "").toLowerCase().includes(needle));
}

// Two-tier lookup: a strict phrase match first, then a broader search
// (still filtered for relevance) to try to surface at least one real story
// about the city before giving up.
async function fetchCityNews(city) {
  const strict = filterRelevant(
    await fetchGoogleNewsRSS(`"${city}"`, { limit: 15 }),
    city
  );
  if (strict.length > 0) {
    return { items: strict, status: "found" };
  }

  const broad = filterRelevant(
    await fetchGoogleNewsRSS(`${city} British Columbia`, { limit: 15 }),
    city
  );
  if (broad.length > 0) {
    return { items: broad, status: "fallback_story" };
  }

  return { items: [], status: "empty" };
}

async function fetchNearbyNews(city) {
  const towns = getNearbyTowns(city);
  if (towns.length === 0) return { towns: [], items: [] };

  const results = await Promise.allSettled(
    towns.map((t) => fetchGoogleNewsRSS(`"${t}"`, { limit: 5 }))
  );

  const items = [];
  towns.forEach((t, i) => {
    const r = results[i];
    if (r.status === "fulfilled") {
      filterRelevant(r.value, t).forEach((it) => items.push({ ...it, town: t }));
    }
  });

  return { towns, items };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wantDigest = searchParams.get("digest") === "1";
  const city = searchParams.get("city") || "Kamloops";

  try {
    const otherKeys = Object.keys(CATEGORIES);
    const [cityResult, ...otherResults] = await Promise.all([
      fetchCityNews(city),
      ...otherKeys.map((k) =>
        fetchGoogleNewsRSS(CATEGORIES[k].query, { limit: 10 }).catch((e) => ({
          __error: String(e),
        }))
      ),
    ]);

    let nearby = null;
    if (cityResult.status === "empty") {
      nearby = await fetchNearbyNews(city).catch(() => ({ towns: [], items: [] }));
    }

    const resolvedCategories = {
      local: {
        label: `${city}, BC`,
        items: cityResult.items,
        status: cityResult.status, // "found" | "fallback_story" | "empty"
        nearby,
      },
    };
    otherKeys.forEach((k, i) => {
      const r = otherResults[i];
      resolvedCategories[k] = {
        label: CATEGORIES[k].label,
        items: Array.isArray(r) ? r : [],
        error: r && r.__error ? r.__error : null,
      };
    });

    let digest = null;
    if (wantDigest && process.env.GROQ_API_KEY) {
      try {
        let localSection;
        if (cityResult.status === "empty") {
          const nearbyText = nearby.items.length
            ? nearby.items
                .slice(0, 8)
                .map((it) => `- [${it.town}] ${it.title} (${it.source})`)
                .join("\n")
            : "No stories found in nearby towns either.";
          localSection =
            `${city}, BC: No new news located for ${city}.\n` +
            `Nearby towns (${nearby.towns.join(", ") || "none found"}):\n${nearbyText}`;
        } else {
          localSection =
            `${resolvedCategories.local.label}${
              cityResult.status === "fallback_story"
                ? " (no recent city news — general story)"
                : ""
            }:\n` +
            cityResult.items
              .slice(0, 5)
              .map((it) => `- ${it.title} (${it.source})`)
              .join("\n");
        }

        const otherSections = otherKeys
          .map(
            (k) =>
              `${resolvedCategories[k].label}:\n` +
              resolvedCategories[k].items
                .slice(0, 5)
                .map((it) => `- ${it.title} (${it.source})`)
                .join("\n")
          )
          .join("\n\n");

        const headlineText = `${localSection}\n\n${otherSections}`;

        const emptyInstruction =
          cityResult.status === "empty"
            ? ` The ${city} section above found no local news. Your briefing MUST begin with the exact sentence "No new news located for ${city}." and then continue by summarizing what's happening in the nearby towns listed instead, before moving on to Canada, USA, and world news.`
            : "";

        digest = await summarize(
          `You are a concise news briefing assistant writing for a Canadian reader based near ${city}, British Columbia. Based only on the headlines below, write a short 4-6 sentence spoken-style morning briefing covering the most important developments, prioritizing local news first, then Canada, then the USA, then the rest of the world. Mention wildfire or conflict news if present.${emptyInstruction} Cover distinct stories only — never restate or rephrase the same story more than once. Do not invent facts beyond what's implied by these headlines. Do not use markdown formatting.\n\n${headlineText}`,
          { maxTokens: 350 }
        );
      } catch (e) {
        digest = null;
      }
    }

    return NextResponse.json({
      categories: resolvedCategories,
      city,
      digest,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
