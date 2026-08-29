import { NextResponse } from "next/server"
import { buildMerchantFeedXml } from "@/lib/feed/merchant-feed"

export const revalidate = 3600

/**
 * Feed Google Merchant (XML): `/api/feed/products`.
 * Da registrare in Merchant Center come feed "Google Sheets/URL".
 */
export async function GET() {
  try {
    const xml = await buildMerchantFeedXml()
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Feed non disponibile" },
      { status: 500 },
    )
  }
}