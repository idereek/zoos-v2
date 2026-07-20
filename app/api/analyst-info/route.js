export const dynamic = "force-dynamic";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return Response.json({ error: "symbol шаардлагатай" }, { status: 400 });
  }

  try {
    const [recRes, earningsRes] = await Promise.all([
      fetch(
        `https://finnhub.io/api/v1/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`,
        { cache: "no-store" }
      ),
      fetch(
        `https://finnhub.io/api/v1/calendar/earnings?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`,
        { cache: "no-store" }
      ),
    ]);

    let recommendation = null;
    if (recRes.ok) {
      const recData = await recRes.json();
      recommendation = recData?.[0] || null;
    }

    let nextEarnings = null;
    if (earningsRes.ok) {
      const earningsData = await earningsRes.json();
      const items = earningsData?.earningsCalendar || [];
      const today = new Date().toISOString().slice(0, 10);
      const upcoming = items
        .filter((e) => e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));
      nextEarnings = upcoming[0] || null;
    }

    return Response.json({ ok: true, recommendation, nextEarnings });
  } catch (err) {
    return Response.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
