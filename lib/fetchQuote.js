export async function getQuote(symbol) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("Server дээр API key тохируулаагvй байна");
  }
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;

  let res = await fetch(url, { cache: "no-store" });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 800));
    res = await fetch(url, { cache: "no-store" });
  }

  if (!res.ok) {
    throw new Error(`${symbol}: Finnhub алдаа (${res.status})`);
  }

  const data = await res.json();
  if (!data || typeof data.c !== "number" || data.c === 0) {
    throw new Error(`${symbol}: ханшийн дата олдсонгvй`);
  }
  const current = data.c;
  const prevClose = data.pc;
  const percent = prevClose ? ((current - prevClose) / prevClose) * 100 : 0;
  return {
    symbol: symbol.toUpperCase(),
    current,
    percent,
    open: data.o,
    high: data.h,
    low: data.l,
    prevClose,
  };
}
