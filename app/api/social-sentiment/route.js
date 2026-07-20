export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return Response.json({ error: "symbol шаардлагатай" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(symbol)}.json`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`StockTwits HTTP ${res.status}`);
    }

    const data = await res.json();
    const messages = data.messages || [];

    let bullish = 0;
    let bearish = 0;
    let neutral = 0;

    messages.forEach((m) => {
      const sentiment = m.entities?.sentiment?.basic;
      if (sentiment === "Bullish") bullish++;
      else if (sentiment === "Bearish") bearish++;
      else neutral++;
    });

    const total = bullish + bearish + neutral;
    const tagged = bullish + bearish;

    return Response.json({
      ok: true,
      total,
      tagged,
      bullish,
      bearish,
      neutral,
      bullishPct: tagged ? Math.round((bullish / tagged) * 100) : null,
    });
  } catch (err) {
    return Response.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
