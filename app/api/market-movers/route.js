export const dynamic = "force-dynamic";

const STOCK_SYMBOLS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "JPM", name: "JPMorgan" },
  { symbol: "V", name: "Visa" },
  { symbol: "WMT", name: "Walmart" },
  { symbol: "DIS", name: "Disney" },
  { symbol: "BA", name: "Boeing" },
  { symbol: "KO", name: "Coca-Cola" },
];

async function fetchStockQuotes() {
  const apiKey = process.env.FINNHUB_API_KEY;
  const results = [];
  const batchSize = 4;
  for (let i = 0; i < STOCK_SYMBOLS.length; i += batchSize) {
    const batch = STOCK_SYMBOLS.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (s) => {
        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${s.symbol}&token=${apiKey}`,
            { cache: "no-store" }
          );
          const data = await res.json();
          if (!data || typeof data.c !== "number" || data.c === 0) return null;
          const percent = data.pc ? ((data.c - data.pc) / data.pc) * 100 : 0;
          return { symbol: s.symbol, name: s.name, current: data.c, percent };
        } catch {
          return null;
        }
      })
    );
    results.push(...batchResults.filter(Boolean));
    if (i + batchSize < STOCK_SYMBOLS.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return results;
}

async function fetchCryptoMovers() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h",
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("CoinGecko error");
  const data = await res.json();
  return data
    .filter((c) => typeof c.price_change_percentage_24h === "number")
    .map((c) => ({
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      current: c.current_price,
      percent: c.price_change_percentage_24h,
      image: c.image,
    }));
}

function getMood(upPct) {
  if (upPct >= 60) return "bullish";
  if (upPct <= 40) return "bearish";
  return "neutral";
}

export async function GET() {
  try {
    const [stockQuotes, cryptoMovers] = await Promise.all([
      fetchStockQuotes(),
      fetchCryptoMovers(),
    ]);

    const sortedStocks = [...stockQuotes].sort((a, b) => b.percent - a.percent);
    const stockGainers = sortedStocks.slice(0, 5);
    const stockLosers = sortedStocks.slice(-5).reverse();
    const stockUpCount = stockQuotes.filter((s) => s.percent >= 0).length;
    const stockTotal = stockQuotes.length;
    const stockUpPct = stockTotal ? (stockUpCount / stockTotal) * 100 : 50;

    const sortedCrypto = [...cryptoMovers].sort((a, b) => b.percent - a.percent);
    const cryptoGainers = sortedCrypto.slice(0, 5);
    const cryptoLosers = sortedCrypto.slice(-5).reverse();
    const cryptoUpCount = cryptoMovers.filter((c) => c.percent >= 0).length;
    const cryptoTotal = cryptoMovers.length;
    const cryptoUpPct = cryptoTotal ? (cryptoUpCount / cryptoTotal) * 100 : 50;

    return Response.json({
      ok: true,
      stocks: {
        gainers: stockGainers,
        losers: stockLosers,
        upCount: stockUpCount,
        total: stockTotal,
        mood: getMood(stockUpPct),
      },
      crypto: {
        gainers: cryptoGainers,
        losers: cryptoLosers,
        mood: getMood(cryptoUpPct),
      },
    });
  } catch (err) {
    return Response.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
