import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Reserved for the future auth/admin stage. The public landing and crest files
// do not refresh sessions, call Supabase or redirect visitors to a login screen.
export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
