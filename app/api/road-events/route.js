import { NextResponse } from "next/server";
import { fetchRoadEvents } from "../../../lib/drivebc";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchRoadEvents();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
