"use client";
import { useEffect, useRef } from "react";

const fmtUSD = (n) =>
  "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : 2 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

const TAPE_CRYPTO_IDS = [
  "bitcoin", "ethereum", "binancecoin", "solana", "ripple",
  "cardano", "dogecoin", "chainlink",
];

const TAPE_STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "NFLX", "AMD", "JPM"];

const STOCK_DOMAINS = {
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  GOOGL: "google.com",
  AMZN: "amazon.com",
  META: "meta.com",
  NVDA: "nvidia.com",
  TSLA: "tesla.com",
  NFLX: "netflix.com",
  AMD: "amd.com",
  JPM: "jpmorganchase.com",
};

const TAPE_COMMODITIES = [
  { symbol: "UNG", label: "Байгалийн хий", icon: "🔥" },
  { symbol: "UGA", label: "Бензин", icon: "⛽" },
];

async function fetchQuotesBatched(symbols, batchSize = 4, delayMs = 300) {
  const out = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((s) =>
        fetch(`/api/quote?symbol=${encodeURIComponent(s)}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );
    out.push(...batchResults);
    if (i + batchSize < symbols.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return out;
}

export default function TickerTape() {
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const rafStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function startTickerScroll() {
      if (rafStartedRef.current || prefersReducedMotion) return;
      rafStartedRef.current = true;
      const track = trackRef.current;
      let lastTime = null;
      const PX_PER_SECOND = 55;

      function step(now) {
        if (cancelled || !track) return;
        if (lastTime === null) lastTime = now;
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0) {
          offsetRef.current -= PX_PER_SECOND * dt;
          if (offsetRef.current <= -halfWidth) offsetRef.current += halfWidth;
          track.style.transform = `translateX(${offsetRef.current}px)`;
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    async function loadTickerTape() {
      let cryptoData = [];
      let stockItemsHtml = "";
      let metalItemsHtml = "";
      let commodityItemsHtml = "";

      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${TAPE_CRYPTO_IDS.join(",")}`
        );
        cryptoData = await res.json();
      } catch (e) {}

      const cryptoItemsHtml = cryptoData
        .map((c) => {
          const up = c.price_change_percentage_24h >= 0;
          return `<span class="tape-item">
            <img class="tape-logo" src="${c.image}" alt="" onerror="this.style.display='none'">
            <b>${c.symbol.toUpperCase()}</b> ${fmtUSD(c.current_price)}
            <span class="${up ? "up" : "down"}">${fmtPct(c.price_change_percentage_24h || 0)}</span>
          </span>`;
        })
        .join("");

      try {
        const results = await fetchQuotesBatched(TAPE_STOCK_SYMBOLS, 4, 300);
        stockItemsHtml = results
          .filter(Boolean)
          .map((d) => {
            const domain = STOCK_DOMAINS[d.symbol];
            const up = d.percent >= 0;
            const logo = domain
              ? `<img class="tape-logo" src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt="" onerror="this.style.display='none'">`
              : "";
            return `<span class="tape-item">
              ${logo}<b>${d.symbol}</b> ${fmtUSD(d.current)}
              <span class="${up ? "up" : "down"}">${fmtPct(d.percent || 0)}</span>
            </span>`;
          })
          .join("");
      } catch (e) {}

      try {
        const [goldRes, silverRes, copperResults] = await Promise.all([
          fetch("https://api.gold-api.com/price/XAU"),
          fetch("https://api.gold-api.com/price/XAG"),
          fetchQuotesBatched(["CPER"], 1, 0),
        ]);
        const gold = goldRes.ok ? await goldRes.json() : null;
        const silver = silverRes.ok ? await silverRes.json() : null;
        const copper = copperResults[0];
        metalItemsHtml = [
          gold ? `<span class="tape-item">🥇 <b>Алт (XAU)</b> ${fmtUSD(gold.price)}</span>` : "",
          silver ? `<span class="tape-item">🥈 <b>Мөнгө (XAG)</b> ${fmtUSD(silver.price)}</span>` : "",
          copper
            ? `<span class="tape-item">🟤 <b>Зэс</b> ${fmtUSD(copper.current)}
                <span class="${copper.percent >= 0 ? "up" : "down"}">${fmtPct(copper.percent || 0)}</span>
              </span>`
            : "",
        ].join("");
      } catch (e) {}

      try {
        const results = await fetchQuotesBatched(TAPE_COMMODITIES.map((c) => c.symbol), 4, 300);
        commodityItemsHtml = results
          .map((d, i) => {
            if (!d) return "";
            const meta = TAPE_COMMODITIES[i];
            const up = d.percent >= 0;
            return `<span class="tape-item">
              ${meta.icon} <b>${meta.label}</b> ${fmtUSD(d.current)}
              <span class="${up ? "up" : "down"}">${fmtPct(d.percent || 0)}</span>
            </span>`;
          })
          .join("");
      } catch (e) {}

      if (cancelled) return;
      const track = trackRef.current;
      if (!track) return;
      const allItems = cryptoItemsHtml + stockItemsHtml + metalItemsHtml + commodityItemsHtml;
      if (!allItems) {
        track.innerHTML = `<span class="tape-item">Ачааллаж чадсангvй</span>`;
        return;
      }
      track.innerHTML = allItems + allItems;
      startTickerScroll();
    }

    loadTickerTape();
    const interval = setInterval(loadTickerTape, 180000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="ticker-tape" aria-hidden="true">
      <div className="ticker-track" ref={trackRef} id="tickerTrack" />
    </div>
  );
}
