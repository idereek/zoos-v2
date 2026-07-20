"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";

const LABELS = {
  mn: {
    title: "Өнөөдрийн зах зээл",
    bullish: "Өсөх хандлагатай",
    bearish: "Буурах хандлагатай",
    neutral: "Тодорхойгvй чиглэлтэй",
    stockLine: (upCount, total) => `Том компаниудаас ${upCount}/${total} өссөн байна.`,
    topGainerLabel: "Хамгийн их анхаарал татаж байна",
    cryptoLine: "Криптогийн зах зээлийн ерөнхий уур амьсгал:",
    disclaimer: "* Энэ бол бодит тоон дата дээр vндэслэсэн автомат хураангуй, хөрөнгө оруулалтын зөвлөгөө биш.",
    loading: "Ачаалж байна...",
  },
  en: {
    title: "Market today",
    bullish: "Bullish",
    bearish: "Bearish",
    neutral: "Mixed signals",
    stockLine: (upCount, total) => `${upCount} of ${total} large-caps are up today.`,
    topGainerLabel: "Drawing the most attention",
    cryptoLine: "Overall crypto market mood:",
    disclaimer: "* Automated summary based on live data, not investment advice.",
    loading: "Loading...",
  },
};

function StockIcon({ symbol }) {
  const [failed, setFailed] = useState(false);
  const src = `https://financialmodelingprep.com/image-stock/${symbol}.png`;
  if (failed) {
    return <span className="ms-highlight-icon ms-icon-fallback">{symbol.slice(0, 2)}</span>;
  }
  return (
    <img
      src={src}
      alt=""
      className="ms-highlight-icon"
      onError={() => setFailed(true)}
    />
  );
}

export default function MarketSummary() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const { lang } = useI18n();
  const L = LABELS[lang] || LABELS.mn;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market-movers")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.ok) {
          setError(true);
          return;
        }
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return null;
  if (!data) return <p className="market-summary-loading">{L.loading}</p>;

  const { upCount, total, mood } = data.stocks;
  const upPct = total ? Math.round((upCount / total) * 100) : 50;
  const topGainer = data.stocks.gainers[0];
  const cryptoMood = data.crypto.mood;

  return (
    <section className="market-summary">
      <div className="ms-header">
        <h2 className="market-summary-title">{L.title}</h2>
        <span className={`ms-mood-badge mood-${mood}`}>{L[mood]}</span>
      </div>

      <div className="ms-body">
        <div className="ms-sentiment">
          <div className="ms-sentiment-bar">
            <div className="ms-bar-up" style={{ width: `${upPct}%` }} />
            <div className="ms-bar-down" style={{ width: `${100 - upPct}%` }} />
          </div>
          <p className="ms-sentiment-text">{L.stockLine(upCount, total)}</p>
        </div>

        {topGainer && (
          <div className="ms-highlight">
            <StockIcon symbol={topGainer.symbol} />
            <div className="ms-highlight-info">
              <span className="ms-highlight-label">{L.topGainerLabel}</span>
              <span className="ms-highlight-name">
                {topGainer.name} <span className="ms-highlight-symbol">({topGainer.symbol})</span>
              </span>
            </div>
            <span className="ms-highlight-pct">+{topGainer.percent.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="ms-crypto-line">
        <span className={`ms-crypto-dot mood-${cryptoMood}`} />
        <span>{L.cryptoLine} <strong>{L[cryptoMood]}</strong></span>
      </div>

      <p className="market-summary-disclaimer">{L.disclaimer}</p>
    </section>
  );
}
