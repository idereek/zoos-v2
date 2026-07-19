import { getAssetType, getCryptoMeta } from "./assetType";

export async function getAssetQuote(ticker) {
  const type = getAssetType(ticker);
  return type === "crypto" ? getCryptoQuote(ticker) : getStockQuote(ticker);
}

async function getStockQuote(ticker) {
  const res = await fetch(`/api/quote?symbol=${encodeURIComponent(ticker)}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch quote");
  }
  const change = data.current - data.prevClose;
  const changePercent = data.percent;
  return {
    type: "stock",
    symbol: data.symbol,
    current: data.current,
    open: data.open,
    high: data.high,
    low: data.low,
    prevClose: data.prevClose,
    change,
    changePercent,
    percent: changePercent,
  };
}

async function getCryptoQuote(ticker) {
  const meta = getCryptoMeta(ticker);
  if (!meta) throw new Error("Unknown crypto ticker");
  const [marketRes, chartRes] = await Promise.all([
    fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${meta.coingeckoId}`, {
      cache: "no-store",
    }),
    fetch(`https://api.coingecko.com/api/v3/coins/${meta.coingeckoId}/market_chart?vs_currency=usd&days=7`, {
      cache: "no-store",
    }),
  ]);
  if (!marketRes.ok) throw new Error(`CoinGecko markets ${marketRes.status}`);
  if (!chartRes.ok) throw new Error(`CoinGecko market_chart ${chartRes.status}`);
  const marketData = (await marketRes.json())[0];
  if (!marketData) throw new Error("CoinGecko: coin not found");
  const chartData = await chartRes.json();
  const weekPrices = chartData.prices.map((p) => p[1]);
  const current = marketData.current_price;
  const change = marketData.price_change_24h || 0;
  const changePercent = marketData.price_change_percentage_24h || 0;
  const high = marketData.high_24h ?? Math.max(...weekPrices);
  const low = marketData.low_24h ?? Math.min(...weekPrices);
  const open = current - change;
  return {
    type: "crypto",
    symbol: marketData.symbol.toUpperCase(),
    name: meta.name,
    current,
    open,
    high,
    low,
    change,
    changePercent,
    percent: changePercent,
    marketCap: marketData.market_cap,
    volume24h: marketData.total_volume,
    weekHigh: Math.max(...weekPrices),
    weekLow: Math.min(...weekPrices),
  };
}
