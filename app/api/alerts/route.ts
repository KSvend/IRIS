import { NextRequest, NextResponse } from "next/server";
import { generateAlerts } from "@/lib/data/alerts";
import type { CountryCode, NarrativeCategory, AlertType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") as CountryCode | null;
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50", 10);
  const categoriesRaw = request.nextUrl.searchParams.get("categories");
  const categories = categoriesRaw
    ? (categoriesRaw.split(",") as NarrativeCategory[])
    : undefined;
  const alertType = request.nextUrl.searchParams.get("alertType") as AlertType | null;

  const alerts = await generateAlerts(
    country || undefined,
    limit,
    categories,
    alertType || undefined
  );
  return NextResponse.json(alerts);
}
