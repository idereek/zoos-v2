import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Банкны нэрийг тодорхойлоход ашиглах, тухайн банкны хvснэгтийн өмнө
// гардаг вэбсайтын холбоосоор нь ялгах зорилготой түлхvvр vгс.
const BANK_MARKERS = [
  { key: "golomtbank.com", name: "Голомт" },
  { key: "tdbm.mn", name: "ХХБанк" },
  { key: "khanbank.com", name: "ХААН" },
  { key: "capitronbank.mn", name: "Капитрон" },
];

const CURRENCY_CODES = ["USD", "EUR", "CNY", "RUB", "JPY", "GBP", "CHF", "KRW", "HKD", "AUD", "CAD", "SGD"];

function extractFirstNumber(text) {
  if (!text) return null;
  const cleaned = text.replace(/,/g, "");
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

async function scrapeGogoRates() {
  const res = await fetch("https://gogo.mn/exchange", { cache: "no-store" });
  const html = await res.text();

  const rows = [];

  // Хvснэгтvvдийг (<table>...</table>) тус тусад нь задлана.
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/g;
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;

  let lastBankName = null;
  let searchIndex = 0;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    // Энэ хvснэгтийн ӨМНӨХ 500 тэмдэгтээс банкны нэрийг тодорхойлно.
    const precedingText = html.slice(Math.max(0, tableMatch.index - 500), tableMatch.index);
    const foundMarker = BANK_MARKERS.find((m) => precedingText.includes(m.key));
    if (foundMarker) {
      lastBankName = foundMarker.name;
    }
    if (!lastBankName) continue;

    const tableHtml = tableMatch[1];
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const cells = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      }
      if (cells.length < 3) continue;

      const currencyCell = cells[0];
      const foundCurrency = CURRENCY_CODES.find((c) => currencyCell.includes(c));
      if (!foundCurrency) continue;

      const buy = extractFirstNumber(cells[1]);
      const sell = extractFirstNumber(cells[2]);
      if (buy == null || sell == null) continue;

      rows.push([lastBankName, foundCurrency, buy, sell]);
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
    let errorCount = 0;
    let firstError = null;
    for (const [bank, currency, buy, sell] of rows) {
      const { error } = await supabaseAdmin.from("bank_rates").upsert(
        {
          bank,
          currency,
          buy_rate: buy,
          sell_rate: sell,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "bank,currency" }
      );
      if (error) {
        errorCount++;
        if (!firstError) firstError = error.message;
      } else {
        upsertedCount++;
      }
    }

    return Response.json({ ok: true, upsertedCount, errorCount, firstError, rowsFound: rows.length });
  } catch (err) {
    return Response.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
