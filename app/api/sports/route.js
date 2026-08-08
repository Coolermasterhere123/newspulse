import { NextResponse } from "next/server";
import { LEAGUES } from "../../../lib/sports-leagues";

export const dynamic = "force-dynamic";

function mapEvent(ev) {
  const comp = ev.competitions?.[0];
  const competitors = comp?.competitors || [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");

  return {
    id: ev.id,
    name: ev.shortName || ev.name,
    date: ev.date,
    status: comp?.status?.type?.description || ev.status?.type?.description,
    state: comp?.status?.type?.state, // pre, in, post
    completed: !!comp?.status?.type?.completed,
    home: home && {
      name: home.team?.shortDisplayName || home.team?.displayName,
      abbrev: home.team?.abbreviation,
      score: home.score,
      logo: home.team?.logo,
      winner: !!home.winner,
    },
    away: away && {
      name: away.team?.shortDisplayName || away.team?.displayName,
      abbrev: away.team?.abbreviation,
      score: away.score,
      logo: away.team?.logo,
      winner: !!away.winner,
    },
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league") || "nfl";
  const date = searchParams.get("date"); // YYYYMMDD
  const cfg = LEAGUES[league];

  if (!cfg) {
    return NextResponse.json(
      { error: "Unknown league", leagues: Object.keys(LEAGUES) },
      { status: 400 }
    );
  }

  try {
    const dateParam = date ? `?dates=${encodeURIComponent(date)}` : "";
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${cfg.url}/scoreboard${dateParam}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
    const data = await res.json();

    const events = (data.events || []).map(mapEvent);

    return NextResponse.json({
      league,
      label: cfg.label,
      date: date || null,
      leagues: Object.keys(LEAGUES).map((k) => ({ key: k, label: LEAGUES[k].label })),
      events,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
