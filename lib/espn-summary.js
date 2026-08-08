// Fetches ESPN's public game summary endpoint (same data ESPN's own site
// uses) and distills it into plain facts, which are then handed to Groq to
// write a short natural-language recap. No facts are invented — only what's
// present in the fetched data is used.

export async function fetchGameFacts(sportPath, eventId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${encodeURIComponent(
    eventId
  )}`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error(`ESPN summary fetch failed: ${res.status}`);
  const data = await res.json();

  const comp = data.header?.competitions?.[0];
  const competitors = comp?.competitors || [];
  const statusDesc = comp?.status?.type?.description;
  const state = comp?.status?.type?.state; // pre, in, post
  const period = comp?.status?.period;
  const clock = comp?.status?.displayClock;

  const teams = competitors.map((c) => ({
    name: c.team?.displayName,
    score: c.score,
    linescores: (c.linescores || []).map((l) => l.displayValue ?? l.value),
    homeAway: c.homeAway,
    record: c.records?.[0]?.summary,
  }));

  // Top performers live per-competitor in header.competitions[0].competitors[].leaders,
  // NOT at the top level of the response — that was the bug producing empty results.
  const leaders = competitors.flatMap((c) =>
    (c.leaders || []).flatMap((cat) =>
      (cat.leaders || []).slice(0, 1).map((l) => ({
        team: c.team?.displayName,
        category: cat.displayName || cat.name,
        athlete: l.athlete?.displayName,
        display: l.displayValue,
      }))
    )
  );

  // Concrete in-game moments, when ESPN provides them for this sport.
  const rawPlays =
    data.scoringPlays || data.keyEvents || data.plays?.filter?.((p) => p.scoringPlay) || [];
  const scoringPlays = rawPlays.slice(0, 12).map((p) => ({
    text: p.text,
    team: p.team?.displayName,
    period: p.period?.number,
    clock: p.clock?.displayValue,
  }));

  const venue = data.gameInfo?.venue?.fullName;
  const attendance = data.gameInfo?.attendance;

  return {
    statusDesc,
    state,
    period,
    clock,
    teams,
    leaders: leaders.filter((l) => l.athlete),
    scoringPlays: scoringPlays.filter((p) => p.text),
    venue,
    attendance,
  };
}

export function factsToPrompt(facts, gameName) {
  const lines = [];
  lines.push(`Game: ${gameName}`);
  lines.push(`Status: ${facts.statusDesc || "unknown"}`);
  facts.teams.forEach((t) => {
    lines.push(
      `${t.name}${t.record ? ` (${t.record})` : ""}: ${t.score ?? "?"}${
        t.linescores?.length ? ` [by period: ${t.linescores.join(", ")}]` : ""
      }`
    );
  });
  if (facts.leaders.length) {
    lines.push("Top performers:");
    facts.leaders.forEach((l) => {
      lines.push(`- ${l.athlete} (${l.team} — ${l.category}): ${l.display}`);
    });
  }
  if (facts.scoringPlays.length) {
    lines.push("Key scoring plays in order:");
    facts.scoringPlays.forEach((p) => {
      const when = [p.period ? `Q/P${p.period}` : null, p.clock].filter(Boolean).join(" ");
      lines.push(`- ${when ? `[${when}] ` : ""}${p.text}`);
    });
  }
  if (facts.venue) lines.push(`Venue: ${facts.venue}`);
  return lines.join("\n");
}
