import { NextRequest, NextResponse } from "next/server";

// Stub endpoint for future live ingestion
// Accepts social media posts from external connectors
export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO: Validate against MonitoringPost schema
  // TODO: Run through ML classification pipeline
  // TODO: Store in database
  // TODO: Generate alerts if thresholds exceeded

  return NextResponse.json({
    status: "accepted",
    message: "Ingestion endpoint stub - not yet implemented",
    receivedCount: Array.isArray(body) ? body.length : 1,
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ready",
    connectors: [
      { name: "csv", status: "active", description: "CSV file loader" },
      { name: "twitter_api", status: "stub", description: "Twitter/X API v2" },
      { name: "facebook_api", status: "stub", description: "Facebook Graph API" },
      { name: "tiktok_api", status: "stub", description: "TikTok Research API" },
    ],
  });
}
