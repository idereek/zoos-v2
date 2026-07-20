"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPortfolio, removeHolding } from "@/lib/portfolio";
import { getAssetQuote } from "@/lib/assetQuote";
import AddHoldingForm from "./AddHoldingForm";

const fmtUSD = (n) =>
  "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

const BAR_COLORS = ["#B8862B", "#12946B", "#C4463A", "#7A7266", "#C9973A", "#3B82F6", "#8B5CF6", "#EC4899"];

export default function PortfolioPanel({ userId }) {
  const [holdings, setHoldings] = useState([]);
  const [status, setStatus] = useState("loading");

  async function load() {
    setStatus("loading");
    try {
      const rows = await getPortfolio(userId);
      if (!rows.length) {
        setHoldings([]);
        setStatus("empty");
        window.dispatchEvent(new Event("portfolio-updated"));
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
      setHoldings(withQuotes);
      setStatus("ready");
      window.dispatchEvent(new Event("portfolio-updated"));
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleRemove(id) {
    await removeHolding(userId, id);
    load();
  }

  const validHoldings = holdings.filter((h) => h.quote);
  const totalValue = validHoldings.reduce((sum, h) => sum + h.quantity * h.quote.current, 0);
  const totalCost = validHoldings.reduce((sum, h) => sum + h.quantity * h.buy_price, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost ? (totalGain / totalCost) * 100 : 0;
  const totalUp = totalGain >= 0;

  return (
    <div className="portfolio-panel">
      <AddHoldingForm userId={userId} onAdded={load} />

      {status === "loading" && <div className="watchlist-empty">Ачаалж байна...</div>}
      {status === "empty" && (
        <div className="watchlist-empty">Миний ДАНС хоосон байна. Дээрх маягтаар нэмнэ vv.</div>
      )}
      {status === "error" && <div className="watchlist-empty">Алдаа гарлаа.</div>}

      {status === "ready" && (
        <>
          <div className="portfolio-summary">
            <div className="portfolio-summary-item">
              <span className="portfolio-summary-label">Нийт vнэлгээ</span>
              <span className="portfolio-summary-val">{fmtUSD(totalValue)}</span>
            </div>
            <div className="portfolio-summary-item">
              <span className="portfolio-summary-label">Нийт зарцуулсан</span>
              <span className="portfolio-summary-val">{fmtUSD(totalCost)}</span>
            </div>
            <div className="portfolio-summary-item">
              <span className="portfolio-summary-label">Ашиг/Алдагдал</span>
              <span className={`portfolio-summary-val ${totalUp ? "up" : "down"}`}>
                {fmtUSD(totalGain)} ({fmtPct(totalGainPct)})
              </span>
            </div>
          </div>

          {totalValue > 0 && (
            <div className="portfolio-allocation">
              <div className="allocation-bar">
                {validHoldings.map((h, i) => {
                  const value = h.quantity * h.quote.current;
                  const widthPct = (value / totalValue) * 100;
                  return (
                    <div
                      key={h.id}
                      className="allocation-segment"
                      style={{ width: `${widthPct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                      title={`${h.ticker}: ${widthPct.toFixed(1)}%`}
                    />
                  );
                })}
              </div>
              <div className="allocation-legend">
                {validHoldings.map((h, i) => {
                  const value = h.quantity * h.quote.current;
                  const widthPct = (value / totalValue) * 100;
                  return (
                    <span key={h.id} className="allocation-legend-item">
                      <span
                        className="allocation-dot"
                        style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                      />
                      {h.ticker} {widthPct.toFixed(1)}%
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="holdings-list">
            {holdings.map((h) => {
              const value = h.quote ? h.quantity * h.quote.current : null;
              const cost = h.quantity * h.buy_price;
              const gain = value != null ? value - cost : null;
              const gainPct = value != null && cost ? (gain / cost) * 100 : null;
              const up = gain != null && gain >= 0;

              return (
                <div key={h.id} className="holding-row">
                  <Link href={`/asset/${h.ticker}`} className="holding-row-main">
                    <span className="holding-ticker">{h.ticker}</span>
                    <span className="holding-qty">{h.quantity} ширхэг</span>
                  </Link>
                  <div className="holding-figures">
                    {value != null ? (
                      <>
                        <span className="holding-value">{fmtUSD(value)}</span>
                        <span className={`holding-gain ${up ? "up" : "down"}`}>
                          {fmtUSD(gain)} ({fmtPct(gainPct)})
                        </span>
                      </>
                    ) : (
                      <span className="holding-value">дата олдсонгvй</span>
                    )}
                  </div>
                  <button
                    className="holding-remove"
                    type="button"
                    onClick={() => handleRemove(h.id)}
                    title="Устгах"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <p className="portfolio-disclaimer">
            * "Миний ДАНС" хэсэг нь таны өөрийн оруулсан мэдээлэл дээр vндэслэсэн тооцоолол бөгөөд
            бодит брокер/банкны дансны мэдээлэлтэй холбоогvй, хөрөнгө оруулалтын зөвлөгөө биш.
          </p>
        </>
      )}
    </div>
  );
}
