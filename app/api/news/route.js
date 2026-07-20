async function translateToMongolian(text) {
  if (!text) return "";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|mn`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch (e) {
    return text;
  }
}

const POSITIVE_WORDS = [
  "surge", "surges", "surged", "soar", "soars", "soared", "jump", "jumps", "jumped",
  "beat", "beats", "beating", "gain", "gains", "gained", "rally", "rallies", "rallied",
  "upgrade", "upgrades", "upgraded", "record", "growth", "grows", "grew", "outperform",
  "bullish", "boost", "boosts", "boosted", "rise", "rises", "rose", "climb", "climbs",
  "strong", "profit", "profits", "exceed", "exceeds", "exceeded", "top", "tops",
  "positive", "win", "wins", "won", "success", "successful", "high", "higher",
];

const NEGATIVE_WORDS = [
  "plunge", "plunges", "plunged", "crash", "crashes", "crashed", "fall", "falls", "fell",
  "drop", "drops", "dropped", "miss", "misses", "missed", "downgrade", "downgrades", "downgraded",
  "loss", "losses", "lost", "decline", "declines", "declined", "bearish", "slump", "slumps",
  "slumped", "sink", "sinks", "sank", "warn", "warns", "warned", "warning", "cut", "cuts",
  "weak", "concern", "concerns", "risk", "risks", "lawsuit", "investigation", "recall",
  "layoff", "layoffs", "negative", "low", "lower", "sell-off", "selloff",
];

function scoreSentiment(text) {
  if (!text) return "neutral";
  const lower = text.toLowerCase();
  let posCount = 0;
  let negCount = 0;
  POSITIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) posCount++;
  });
  NEGATIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) negCount++;
  });
  if (posCount > negCount) return "positive";
  if (negCount > posCount) return "negative";
  return "neutral";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type");
  const lang = searchParams.get("lang") || "mn";
  if (!symbol) {
    return Response.json({ error: "symbol параметр дутуу байна" }, { status: 400 });
  }
  try {
    let rawItems = [];
    if (type === "crypto") {
      const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${encodeURIComponent(symbol)}`;
      const cc = await fetch(url);
      const ccData = await cc.json();
      rawItems = (ccData?.Data || []).slice(0, 3).map((n) => ({
        headline: n.title,
        summary: (n.body || "").slice(0, 180),
        url: n.url,
      }));
    } else {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey) {
        return Response.json(
          { error: "Server дээр API key тохируулаагvй байна" },
          { status: 500 }
        );
      }
      const to = new Date();
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fmt = (d) => d.toISOString().split("T")[0];
      const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${apiKey}`;
      const fh = await fetch(url);
      const fhData = await fh.json();
      rawItems = (Array.isArray(fhData) ? fhData : []).slice(0, 3).map((n) => ({
        headline: n.headline,
        summary: (n.summary || "").slice(0, 180),
        url: n.url,
      }));
    }
    if (!rawItems.length) {
      return Response.json({ items: [] });
    }

    const withSentiment = rawItems.map((item) => ({
      ...item,
      sentiment: scoreSentiment(`${item.headline} ${item.summary}`),
    }));

    if (lang === "en") {
      return Response.json({ items: withSentiment });
    }

    const translated = await Promise.all(
      withSentiment.map(async (item) => {
        const combined = `${item.headline}\n${item.summary}`;
        const translatedCombined = await translateToMongolian(combined);
        const [tHeadline, ...rest] = translatedCombined.split("\n");
        return {
          headline: tHeadline || item.headline,
          summary: rest.join("\n") || item.summary,
          url: item.url,
          sentiment: item.sentiment,
        };
      })
    );
    return Response.json({ items: translated });
  } catch (e) {
    return Response.json({ error: "Мэдээ татахад алдаа гарлаа" }, { status: 500 });
  }
}
