import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  const supabase = await createClient();
  let error: Error | null = null;

  if (tokenHash && type) error = (await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  else if (code) error = (await supabase.auth.exchangeCodeForSession(code)).error;
  else error = new Error("Missing authentication code.");

  if (!error) return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/dashboard", origin));
  const loginUrl = new URL("/login", origin); loginUrl.searchParams.set("error","Authentication link is invalid or has expired.");
  return NextResponse.redirect(loginUrl);
}
