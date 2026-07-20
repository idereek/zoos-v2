"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { useAuthModal } from "@/lib/AuthModalContext";
import { useI18n } from "@/lib/i18n/I18nContext";
import { getWatchlist, removeFromWatchlist } from "@/lib/watchlist";
import { getAssetQuote } from "@/lib/assetQuote";
import PortfolioPanel from "@/components/PortfolioPanel";

const fmtUSD = (n) =>
  "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : 2 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

function DashboardContent() {
  const searchParams = useSearchParams();
  const { user, loading: sessionLoading } = useSession();
  const { openAuthModal } = useAuthModal();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("watchlist");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (searchParams.get("tab") === "portfolio") {
      setActiveTab("portfolio");
    }
  }, [searchParams]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      setStatus("empty");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    getWatchlist(user.id)
      .then(async (rows) => {
        if (cancelled) return;
        if (!rows.length) {
          setItems([]);
          setStatus("empty");
          return;
        }

        const withQuotes = await Promise.all(
          rows.map(async (row) => {
            try {
              const quote = await getAssetQuote(row.ticker);
              return { ...row, quote };
            } catch {
              return { ...row, quote: null };
            }
          })
        );

        if (cancelled) return;
        setItems(withQuotes);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [user, sessionLoading]);

  async function handleRemove(ticker, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await removeFromWatchlist(user.id, ticker);
    setItems((prev) => prev.filter((i) => i.ticker !== ticker));
  }

  if (sessionLoading) {
    return <div className="dashboard-wrap loading">{t("loading")}</div>;
  }

  if (!user) {
    return (
      <div className="dashboard-wrap">
        <h1 className="dashboard-title">{t("dashboard_title")}</h1>
        <div className="watchlist-empty">
          {t("dashboard_login_prompt")}
          <br />
          <button
            className="premium-gate-cta"
            type="button"
            style={{ marginTop: 14 }}
            onClick={() => openAuthModal("login")}
          >
            {t("login")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrap">
      <h1 className="dashboard-title">{t("dashboard_title")}</h1>

      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab${activeTab === "watchlist" ? " active" : ""}`}
          type="button"
          onClick={() => setActiveTab("watchlist")}
        >
          Watchlist
        </button>
        <button
          className={`dashboard-tab${activeTab === "portfolio" ? " active" : ""}`}
          type="button"
          onClick={() => setActiveTab("portfolio")}
        >
          Миний ДАНС
        </button>
      </div>

      {activeTab === "watchlist" && (
        <>
          {status === "loading" && <div className="watchlist-empty">{t("loading")}</div>}
          {status === "empty" && <div className="watchlist-empty">{t("dashboard_empty")}</div>}
          {status === "error" && <div className="watchlist-empty">{t("dashboard_error")}</div>}

          {status === "ready" &&
            items.map((item) => {
              const up = item.quote?.percent >= 0;
              return (
                <Link key={item.ticker} href={`/asset/${item.ticker}`} className="watchlist-item">
                  <div className="watchlist-item-left">
                    <span className="watchlist-item-ticker">{item.ticker}</span>
                    <span className="watchlist-item-type">
                      {item.asset_type === "crypto" ? t("type_crypto") : t("type_stock")}
                    </span>
                  </div>

                  {item.quote ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span className="watchlist-item-price">
                        {fmtUSD(item.quote.current)}{" "}
                        <span className={up ? "up" : "down"}>{fmtPct(item.quote.percent)}</span>
                      </span>
                      <button
                        className="watch-star"
                        onClick={(e) => handleRemove(item.ticker, e)}
                        title="Remove"
                        type="button"
                      >
                        ★
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: "#999", fontSize: 13 }}>{t("dashboard_no_data")}</span>
                  )}
                </Link>
              );
            })}
        </>
      )}

      {activeTab === "portfolio" && <PortfolioPanel userId={user.id} />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="dashboard-wrap loading">Ачаалж байна...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
