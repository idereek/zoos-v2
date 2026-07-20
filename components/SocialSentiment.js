"use client";
import { useEffect, useState } from "react";

export default function SocialSentiment({ ticker }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`/api/social-sentiment?symbol=${encodeURIComponent(ticker)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.ok || !json.tagged) {
          setStatus("empty");
          return;
        }
        setData(json);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("empty");
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (status === "loading" || status === "empty") return null;
  if (!data) return null;

  const bullish = data.bullishPct;
  const bearish = 100 - bullish;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const bullDash = (bullish / 100) * circumference;
  const bullGap = circumference - bullDash;
  const bearDash = (bearish / 100) * circumference;
  const bearGap = circumference - bearDash;
  const bearOffset = -bullDash;

  return (
    <div className="analyst-card">
      <h3 className="analyst-card-title">Олон нийтийн sentiment (StockTwits)</h3>
      <div className="analyst-card-body">
        <svg viewBox="0 0 100 100" className="analyst-donut">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--line)" strokeWidth="14" />
          {bullish > 0 && (
            <circle
              cx="50" cy="50" r={radius} fill="none" stroke="var(--gain)" strokeWidth="14"
              strokeDasharray={`${bullDash} ${bullGap}`} transform="rotate(-90 50 50)"
            />
          )}
          {bearish > 0 && (
            <circle
              cx="50" cy="50" r={radius} fill="none" stroke="var(--loss)" strokeWidth="14"
              strokeDasharray={`${bearDash} ${bearGap}`} strokeDashoffset={bearOffset} transform="rotate(-90 50 50)"
            />
          )}
          <text x="50" y="46" textAnchor="middle" className="analyst-donut-total">{bullish}%</text>
          <text x="50" y="60" textAnchor="middle" className="analyst-donut-label">Bullish</text>
        </svg>
        <div className="analyst-legend-col">
          <div className="analyst-legend-row">
            <span className="dot" style={{ background: "var(--gain)" }} />
            <span className="analyst-legend-label">Bullish</span>
            <span className="analyst-legend-pct">{bullish}%</span>
          </div>
          <div className="analyst-legend-row">
            <span className="dot" style={{ background: "var(--loss)" }} />
            <span className="analyst-legend-label">Bearish</span>
            <span className="analyst-legend-pct">{bearish}%</span>
          </div>
        </div>
      </div>
      <p className="analyst-disclaimer">* Мэдээллийн зорилготой</p>
    </div>
  );
}
