"use client";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { getTradingViewSymbol } from "@/lib/tvSymbols";

const fmtUSD = (n) =>
  "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : 2 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

const LABELS = {
  mn: {
    title: "Хөрөнгийн зах зээлийн мэдээ",
    gainersStock: "Хамгийн өндөр өсөлттэй хувьцаанууд",
    losersStock: "Хамгийн өндөр уналттай хувьцаанууд",
    gainersCrypto: "Хамгийн өндөр өсөлттэй криптонууд",
    losersCrypto: "Хамгийн өндөр уналттай криптонууд",
    error: "Зах зээлийн мэдээлэл түр ачаалагдсангvй.",
    loading: "Ачаалж байна...",
  },
  en: {
    title: "Stock market news",
    gainersStock: "Top gaining stocks",
    losersStock: "Top losing stocks",
    gainersCrypto: "Top gaining crypto",
    losersCrypto: "Top losing crypto",
    error: "Market data failed to load.",
    loading: "Loading...",
  },
};

function MoverIcon({ symbol, type, image }) {
  const [failed, setFailed] = useState(false);
  const src = type === "crypto" ? image : `https://financialmodelingprep.com/image-stock/${symbol}.png`;

  if (!src || failed) {
    return <span className="mover-icon mover-icon-fallback">{symbol.slice(0, 2)}</span>;
  }
  return (
    <img
      src={src}
      alt=""
      className="mover-icon"
      onError={() => setFailed(true)}
    />
  );
}

function MoverRow({ symbol, name, current, percent, image, type }) {
  const up = percent >= 0;
  const tvSymbol = getTradingViewSymbol(symbol, type);
  const tvUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;
  return (
    <a href={tvUrl} target="_blank" rel="noopener noreferrer" className="mover-row">
      <MoverIcon symbol={symbol} type={type} image={image} />
      <span className="mover-main">
        <span className="mover-symbol">{symbol}</span>
        <span className="mover-name">{name}</span>
      </span>
      <span className="mover-figures">
        <span className="mover-price">{fmtUSD(current)}</span>
        <span className={`mover-pct ${up ? "up" : "down"}`}>
          {up ? "▲" : "▼"} {fmtPct(percent)}
        </span>
      </span>
    </a>
  );
}

export default function MarketPulse() {
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

  if (error) return <p className="market-pulse-error">{L.error}</p>;
  if (!data) return <p className="market-pulse-error">{L.loading}</p>;

  return (
    <section className="market-pulse">
      <div className="market-pulse-header">
        <h2>{L.title}</h2>
      </div>

      <div className="pulse-row">
        <div className="pulse-card">
          <h3 className="pulse-card-title up">▲ {L.gainersStock}</h3>
          {data.stocks.gainers.map((m) => (
            <MoverRow key={m.symbol} {...m} type="stock" />
          ))}
        </div>
        <div className="pulse-card">
          <h3 className="pulse-card-title down">▼ {L.losersStock}</h3>
          {data.stocks.losers.map((m) => (
            <MoverRow key={m.symbol} {...m} type="stock" />
          ))}
        </div>
      </div>

      <div className="pulse-row">
        <div className="pulse-card">
          <h3 className="pulse-card-title up">▲ {L.gainersCrypto}</h3>
          {data.crypto.gainers.map((m) => (
            <MoverRow key={m.symbol} {...m} type="crypto" />
          ))}
        </div>
        <div className="pulse-card">
          <h3 className="pulse-card-title down">▼ {L.losersCrypto}</h3>
          {data.crypto.losers.map((m) => (
            <MoverRow key={m.symbol} {...m} type="crypto" />
          ))}
        </div>
      </div>
    </section>
  );
}
