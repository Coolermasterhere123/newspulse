import { NextResponse } from "next/server";
import { fetchBCFires } from "../../../lib/bcws";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchBCFires();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
