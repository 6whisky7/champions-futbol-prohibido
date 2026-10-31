import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const client = await createClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      const owner = await client.rpc("cfp_is_owner");
      // A transient role lookup failure follows the existing owner gate, which rechecks access.
      if (owner.error || owner.data === true)
        return NextResponse.redirect(new URL("/admin", request.url));
      // LIVE independently verifies the user and lists only explicitly assigned events.
      return NextResponse.redirect(new URL("/live", request.url));
    }
  }
  return NextResponse.redirect(
    new URL("/admin/acceso?estado=enlace-invalido", request.url),
  );
}
