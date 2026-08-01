import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** OAuth (PKCE) callback — exchanges the returned code for a server session
   (cookies are written by the SSR client), then continues into the app. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
