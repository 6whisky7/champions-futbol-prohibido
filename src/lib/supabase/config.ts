export const SUPABASE_PROJECT_REF = "cvenqmszdmhqaeokzbnz";

/** Read lazily so the public, static landing page never needs a database call. */
export function getSupabaseConfig() {
  // Keep direct NEXT_PUBLIC references so Next.js can inline browser values.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error(
      "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY antes de utilizar Supabase.",
    );
  }

  if (url !== `https://${SUPABASE_PROJECT_REF}.supabase.co`) {
    throw new Error("Esta aplicación debe utilizar exclusivamente el proyecto Supabase champions-futbol-prohibido.");
  }

  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Utiliza la clave publishable del proyecto, nunca una clave secret o service_role.");
  }

  return { url, publishableKey };
}
