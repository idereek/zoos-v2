import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error, count } = await supabase
    .from("bank_rates")
    .select("*", { count: "exact" });

  return Response.json({
    error: error ? { message: error.message, code: error.code, details: error.details } : null,
    count,
    sampleRows: data ? data.slice(0, 3) : null,
  });
}
