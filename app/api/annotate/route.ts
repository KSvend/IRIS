import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BACKEND = process.env.IRIS_BACKEND_URL || "http://localhost:8000";
const API_KEY = process.env.B4P_API_KEY || "";

async function getAuthHeaders() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
  };
}

export async function GET(request: NextRequest) {
  const reviewer = request.nextUrl.searchParams.get("reviewer") || "";
  const limit = request.nextUrl.searchParams.get("limit") || "20";
  const offset = request.nextUrl.searchParams.get("offset") || "0";
  const headers = await getAuthHeaders();
  if (!headers) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await fetch(
    `${BACKEND}/posts/blind-review-queue?reviewer=${reviewer}&limit=${limit}&offset=${offset}`,
    { headers }
  );
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers = await getAuthHeaders();
  if (!headers) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await fetch(`${BACKEND}/posts/blind-annotate`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
