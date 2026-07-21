"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAssetQuote } from "@/lib/assetQuote";
import { getAssetType, getCryptoMeta } from "@/lib/assetType";
import { useI18n } from "@/lib/i18n/I18nContext";
import TradingViewChart from "@/components/TradingViewChart";
import AnalysisPanel from "@/components/AnalysisPanel";
import NewsPanel from "@/components/NewsPanel";
import WatchStar from "@/components/WatchStar";
import PremiumGate from "@/components/PremiumGate";
import AnalystInfo from "@/components/AnalystInfo";
import SocialSentiment from "@/components/SocialSentiment";
import PriceAlertForm from "@/components/PriceAlertForm";
import { useSession } from "@/lib/useSession";

const fmtUSD = (n) =>
  "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : 2 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

export default function AssetDetailPage() {
  const params = useParams();
  const ticker = (params?.ticker || "").toUpperCase();
  const type = getAssetType(ticker);
  const cryptoMeta = type === "crypto" ? getCryptoMeta(ticker) : null;
  const { t } = useI18n();
  const { user } = useSession();
  const [status, setStatus] = useState("loading");
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getAssetQuote(ticker)
      .then((data) => {
        if (cancelled) return;
        setQuote(data);
        setStatus("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || t("error_generic"));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (status === "loading") {
    return <div className="loading">{t("loading")}</div>;
  }
  if (status === "error") {
    return (
      <div className="error-state">
        {t("error_generic")}
        <br />
        <small style={{ opacity: 0.6, fontSize: 11 }}>{error}</small>
      </div>
    );
  }

  const up = quote.percent >= 0;
  const stats =
    type === "crypto"
      ? [
          { label: t("stat_marketcap"), value: fmtUSD(quote.marketCap) },
          { label: t("stat_volume24h"), value: fmtUSD(quote.volume24h) },
          { label: t("stat_weekhigh"), value: fmtUSD(quote.weekHigh) },
          { label: t("stat_weeklow"), value: fmtUSD(quote.weekLow) },
        ]
      : [
          { label: t("stat_open"), value: fmtUSD(quote.open) },
          { label: t("stat_high"), value: fmtUSD(quote.high) },
          { label: t("stat_low"), value: fmtUSD(quote.low) },
          { label: t("stat_prevclose"), value: fmtUSD(quote.prevClose) },
        ];

  return (
    <div className="asset-card">
      <div className="asset-head">
        <div className="badge-group">
          <WatchStar ticker={ticker} type={type} />
          <div className="badge live">
            <span className="live-dot" />
            {t("badge_live")}
          </div>
        </div>
        <div className="asset-head-left">
          <span className="asset-type-tag">
            {type === "crypto" ? t("type_crypto") : t("type_stock")}
          </span>
          <span className="asset-ticker">{quote.symbol}</span>
          <span className="asset-price-inline">
            {fmtUSD(quote.current)}{" "}
            <span className={`chg ${up ? "up" : "down"}`}>
              {fmtPct(quote.percent)} {type === "crypto" ? t("chg_24h") : t("chg_today")}
            </span>
          </span>
        </div>
      </div>

      <TradingViewChart ticker={ticker} type={type} />

      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat" key={i}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-val">{s.value}</span>
          </div>
        ))}
      </div>
      <PremiumGate>
        <AnalysisPanel quote={quote} />
      </PremiumGate>
      <div className="analyst-info-grid">
        {type === "stock" && <AnalystInfo ticker={ticker} />}
        <SocialSentiment ticker={ticker} />
        {user && (
          <PremiumGate requiredTier="basic">
            <PriceAlertForm
              userId={user.id}
              ticker={ticker}
              assetType={type}
              currentPrice={quote.current}
            />
          </PremiumGate>
        )}
      </div>
      <NewsPanel ticker={ticker} type={type} nameHint={cryptoMeta?.name} />
    </div>
  );
}
