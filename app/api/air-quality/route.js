import { NextResponse } from "next/server";
import { fetchBCAirQuality } from "../../../lib/aqhi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchBCAirQuality();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
