import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getCurrentPrice(ticker, assetType) {
  if (assetType === "crypto") {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ticker.toLowerCase()}&vs_currencies=usd`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const key = Object.keys(data)[0];
    return data[key]?.usd ?? null;
  }
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.c || null;
}

async function sendAlertEmail(toEmail, ticker, targetPrice, direction, currentPrice) {
  const directionText = direction === "above" ? "дээш давлаа" : "доош унлаа";
  const body = {
    from: "Zoos Alerts <onboarding@resend.dev>",
    to: [toEmail],
    subject: `🔔 ${ticker} таны сэрэмжлvvлэгт хvрлээ`,
    text: `${ticker} vнэ $${targetPrice} ${directionText}.\n\nОдоогийн vнэ: $${currentPrice}\n\nДэлгэрэнгvй: https://stocktuslah.com/asset/${ticker}`,
  };

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");
  const isAuthorized =
    !CRON_SECRET ||
    authHeader === `Bearer ${CRON_SECRET}` ||
    secretParam === CRON_SECRET;

  if (!isAuthorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: alerts, error } = await supabaseAdmin
      .from("price_alerts")
      .select("*")
      .eq("triggered", false);

    if (error) throw error;

    let checkedCount = 0;
    let triggeredCount = 0;

    for (const alert of alerts || []) {
      checkedCount++;
      const currentPrice = await getCurrentPrice(alert.ticker, alert.asset_type);
      if (currentPrice == null) continue;

      const shouldTrigger =
        (alert.direction === "above" && currentPrice >= alert.target_price) ||
        (alert.direction === "below" && currentPrice <= alert.target_price);

      if (shouldTrigger) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(alert.user_id);
        const email = userData?.user?.email;

        if (email) {
          await sendAlertEmail(email, alert.ticker, alert.target_price, alert.direction, currentPrice);
        }

        await supabaseAdmin
          .from("price_alerts")
          .update({ triggered: true })
          .eq("id", alert.id);

        triggeredCount++;
      }
    }

    return Response.json({ ok: true, checkedCount, triggeredCount });
  } catch (err) {
    return Response.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
