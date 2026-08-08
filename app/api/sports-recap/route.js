import { NextResponse } from "next/server";
import { LEAGUES } from "../../../lib/sports-leagues";
import { fetchGameFacts, factsToPrompt } from "../../../lib/espn-summary";
import { summarize } from "../../../lib/groq";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const eventId = searchParams.get("event");
  const gameName = searchParams.get("name") || "This game";

  const cfg = LEAGUES[league];
  if (!cfg || !eventId) {
    return NextResponse.json({ error: "league and event are required" }, { status: 400 });
  }

  try {
    const facts = await fetchGameFacts(cfg.url, eventId);
    const factText = factsToPrompt(facts, gameName);
    const isFinal = facts.state === "post";
    const isLive = facts.state === "in";

    const instruction = isFinal
      ? "Write a short 3-5 sentence recap of this completed game. By name, call out the specific top performers and their stat lines listed below, and reference at least one concrete scoring play if any are listed (who scored, when). Cover the final score and how the game played out. Do not use markdown formatting."
      : isLive
      ? "Write a short 3-4 sentence update on how this game is unfolding so far. By name, call out specific top performers and their stat lines listed below, and mention concrete scoring plays if any are listed (who scored, when). Do not speculate about the outcome. Do not use markdown formatting."
      : "This game hasn't started yet. Write one sentence noting the matchup and that it hasn't begun.";

    let recap = null;
    if (process.env.GROQ_API_KEY) {
      recap = await summarize(
        `You are a sports recap writer who favors specific, concrete details over generic filler. Based ONLY on the facts below — never invent a name, stat, or play that isn't listed — ${instruction} If the facts below don't include top performers or scoring plays, just describe the score and status plainly without inventing any.\n\nFacts:\n${factText}`,
        { maxTokens: 280 }
      );
    }

    return NextResponse.json({
      recap,
      facts,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
