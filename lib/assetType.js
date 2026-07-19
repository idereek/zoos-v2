const CRYPTO_MAP = {
  BTC: { coingeckoId: "bitcoin", name: "Bitcoin" },
  ETH: { coingeckoId: "ethereum", name: "Ethereum" },
  SOL: { coingeckoId: "solana", name: "Solana" },
  XRP: { coingeckoId: "ripple", name: "XRP" },
  DOGE: { coingeckoId: "dogecoin", name: "Dogecoin" },
  ADA: { coingeckoId: "cardano", name: "Cardano" },
  BNB: { coingeckoId: "binancecoin", name: "BNB" },
  MATIC: { coingeckoId: "matic-network", name: "Polygon" },
  DOT: { coingeckoId: "polkadot", name: "Polkadot" },
  LTC: { coingeckoId: "litecoin", name: "Litecoin" },
};

const STOCK_NAMES = {
  AAPL: ["apple"],
  MSFT: ["microsoft"],
  GOOGL: ["google", "alphabet"],
  AMZN: ["amazon"],
  META: ["meta", "facebook"],
  NVDA: ["nvidia"],
  TSLA: ["tesla"],
  NFLX: ["netflix"],
  AMD: ["amd", "advanced micro devices"],
  INTC: ["intel"],
  ORCL: ["oracle"],
  CRM: ["salesforce"],
  ADBE: ["adobe"],
  IBM: ["ibm"],
  CSCO: ["cisco"],
  QCOM: ["qualcomm"],
  UBER: ["uber"],
  ABNB: ["airbnb"],
  SPOT: ["spotify"],
  PYPL: ["paypal"],
  V: ["visa"],
  MA: ["mastercard"],
  JPM: ["jpmorgan", "jp morgan"],
  BAC: ["bank of america"],
  WMT: ["walmart"],
  COST: ["costco"],
  HD: ["home depot"],
  KO: ["coca cola", "coca-cola"],
  PEP: ["pepsi", "pepsico"],
  MCD: ["mcdonalds", "mcdonald's"],
  NKE: ["nike"],
  SBUX: ["starbucks"],
  DIS: ["disney"],
  BA: ["boeing"],
  F: ["ford"],
  GM: ["general motors"],
  XOM: ["exxon", "exxonmobil"],
  CVX: ["chevron"],
  PFE: ["pfizer"],
  JNJ: ["johnson & johnson", "johnson and johnson"],
  T: ["at&t", "att"],
  VZ: ["verizon"],
};

export function getAssetType(ticker) {
  return CRYPTO_MAP[ticker.toUpperCase()] ? "crypto" : "stock";
}

export function getCryptoMeta(ticker) {
  return CRYPTO_MAP[ticker.toUpperCase()] || null;
}

// Хэрэглэгчийн бичсэн текст (ticker эсвэл нэр) хvлээж аваад,
// vvнтэй тохирох бодит ticker-ийг олж буцаана. Тохирол олдохгvй бол,
// оруулсан текстийг л бvтэн vсгээр буцаана (Finnhub/CoinGecko өөрсдөө шалгана).
export function resolveTicker(query) {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  if (CRYPTO_MAP[upper]) return upper;
  if (STOCK_NAMES[upper]) return upper;

  for (const [ticker, meta] of Object.entries(CRYPTO_MAP)) {
    if (meta.name.toLowerCase() === lower) return ticker;
  }

  for (const [ticker, names] of Object.entries(STOCK_NAMES)) {
    if (names.some((n) => n === lower)) return ticker;
  }

  for (const [ticker, meta] of Object.entries(CRYPTO_MAP)) {
    if (meta.name.toLowerCase().includes(lower) || lower.includes(meta.name.toLowerCase())) {
      return ticker;
    }
  }

  for (const [ticker, names] of Object.entries(STOCK_NAMES)) {
    if (names.some((n) => n.includes(lower) || lower.includes(n))) {
      return ticker;
    }
  }

  return upper;
}
