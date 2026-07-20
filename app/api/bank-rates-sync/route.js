import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function scrapeGogoRates() {
  const res = await fetch("https://gogo.mn/", { cache: "no-store" });
  const html = await res.text();

  const rows = [];
  // gogo.mn-ийн ханшийн хvснэгтийг маш энгийн regex-ээр задлах.
  // Тухайн сайтын бvтэц өөрчлөгдвөл, энэ хэсгийг дахин тааруулах шаардлагатай.
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(match[1])) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
    }
    if (cells.length >= 4) {
      rows.push(cells);
    }
  }
  return rows;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");
  const debug = searchParams.get("debug");
  const authHeader = request.headers.get("authorization");

  const isAuthorized =
    !CRON_SECRET ||
    authHeader === `Bearer ${CRON_SECRET}` ||
    secretParam === CRON_SECRET;

  if (!isAuthorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (debug) {
    return Response.json({
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
      hasCronSecret: !!CRON_SECRET,
    });
  }

  try {
    const rows = await scrapeGogoRates();

    let upsertedCount = 0;
    for (const row of rows) {
      const [bank, currency, buyRate, sellRate] = row;
      if (!bank || !currency) continue;
      const buy = parseFloat(buyRate?.replace(/,/g, ""));
      const sell = parseFloat(sellRate?.replace(/,/g, ""));
      if (isNaN(buy) || isNaN(sell)) continue;

      await supabaseAdmin.from("bank_rates").upsert(
        {
          bank,
          currency,
          buy_rate: buy,
          sell_rate: sell,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "bank,currency" }
      );
      upsertedCount++;
    }

    return Response.json({ ok: true, upsertedCount });
  } catch (err) {
    return Response.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
