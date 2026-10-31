import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Refreshes Auth cookies on administrative routes. Every protected page and
// action independently checks the verified user plus database owner permission.
export const config = {
  matcher: ["/admin/:path*", "/live/:path*", "/auth/:path*"],
};
