import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" });

  const asset = id.toLowerCase();

  // 🟢 CRYPTO
  const cryptoMap: Record<string, string> = {
    bitcoin: "bitcoin",
    btc: "bitcoin",
    ethereum: "ethereum",
    eth: "ethereum",
  };

  if (cryptoMap[asset]) {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoMap[asset]}&vs_currencies=usd&include_24hr_change=true`
    );

    const data = await res.json();

    return NextResponse.json({
      asset,
      usd: data?.[cryptoMap[asset]]?.usd,
      usd_24h_change: data?.[cryptoMap[asset]]?.usd_24h_change,
    });
  }

  // 🟣 STOCK MOCK (SAME FORMAT!)
  const stockMap: Record<string, any> = {
    tesla: { usd: 250, usd_24h_change: 1.2 },
    tsla: { usd: 250, usd_24h_change: 1.2 },
    apple: { usd: 195, usd_24h_change: -0.5 },
    aapl: { usd: 195, usd_24h_change: -0.5 },
  };

  if (stockMap[asset]) {
    return NextResponse.json({
      asset,
      usd: stockMap[asset].usd,
      usd_24h_change: stockMap[asset].usd_24h_change,
    });
  }

  return NextResponse.json({
    error: "Asset not found",
  });
}