"use server";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationPayload } from "@/lib/applications";
export async function submitApplication(
  e: string,
  p: ApplicationPayload,
  k: string,
  waiting: boolean,
) {
  const client = await createClient();
  const { data, error } = await client.rpc("cfp_submit_application", {
    e,
    p,
    k,
    waiting,
  });
  return error
    ? { error: error.message }
    : {
        result: data as {
          id: string;
          state: string;
          expires_at: string | null;
        },
      };
}
