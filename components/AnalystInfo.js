"use client";
import { useEffect, useState } from "react";

const MN_MONTHS = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];

function formatPeriod(dateStr) {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  const monthIdx = parseInt(month, 10) - 1;
  return `${year} оны ${MN_MONTHS[monthIdx] || month}`;
}

function formatTitle(dateStr) {
  if (!dateStr) return "Аналистуудын нийтлэг санал";
  const [year, month] = dateStr.split("-");
  const monthNum = parseInt(month, 10);
  return `${year} оны ${monthNum} сард Аналистуудын нийтлэг санал`;
}

const SEGMENTS = [
  { key: "strongBuy", label: "Хvчтэй авах", color: "#0F7A52" },
  { key: "buy", label: "Авах", color: "var(--gain)" },
  { key: "hold", label: "Барих", color: "var(--text-dim)" },
  { key: "sell", label: "Зарах", color: "var(--loss)" },
  { key: "strongSell", label: "Хvчтэй зарах", color: "#8A2E24" },
];

function CandleChart({ rec, total }) {
  const maxValue = Math.max(
    rec.strongBuy || 0,
    rec.buy || 0,
    rec.hold || 0,
    rec.sell || 0,
    rec.strongSell || 0
  );

  return (
    <svg viewBox="0 0 120 100" className="analyst-candles">
      {SEGMENTS.map((seg, i) => {
        const value = rec[seg.key] || 0;
        const heightPct = maxValue ? (value / maxValue) * 70 : 0;
        const x = 8 + i * 22;
        const barTop = 85 - heightPct;
        const wickTop = barTop - 6;
        const wickBottom = 90;
        return (
          <g key={seg.key}>
            <line
              x1={x + 6}
              y1={wickTop}
              x2={x + 6}
              y2={wickBottom}
              stroke={seg.color}
              strokeWidth="1.5"
            />
            <rect
              x={x}
              y={barTop}
              width="12"
              height={Math.max(heightPct, 2)}
              fill={seg.color}
              rx="1.5"
            />
          </g>
        );
      })}
      <line x1="4" y1="90" x2="116" y2="90" stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}

export default function AnalystInfo({ ticker }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`/api/analyst-info?symbol=${encodeURIComponent(ticker)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.ok) {
          setStatus("error");
          return;
        }
        setData(json);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (status === "loading") return null;
  if (status === "error") return null;
  if (!data.recommendation && !data.nextEarnings) return null;

  const rec = data.recommendation;
  const total = rec
    ? rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell
    : 0;

  return (
    <>
      {rec && total > 0 && (
        <div className="analyst-card">
          <h3 className="analyst-card-title">{formatTitle(rec.period)}</h3>
          <div className="analyst-card-body">
            <CandleChart rec={rec} total={total} />
            <div className="analyst-legend-col">
              {SEGMENTS.map((seg) => {
                const value = rec[seg.key] || 0;
                const pct = total ? Math.round((value / total) * 100) : 0;
                return (
                  <div className="analyst-legend-row" key={seg.key}>
                    <span className="dot" style={{ background: seg.color }} />
                    <span className="analyst-legend-label">{seg.label}</span>
                    <span className="analyst-legend-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="analyst-disclaimer">* Мэдээллийн зорилготой</p>
        </div>
      )}

      {data.nextEarnings && (
        <div className="analyst-card earnings-card">
          <h3 className="analyst-card-title">Дараагийн ашгийн тайлан</h3>
          <div className="earnings-card-body">
            <span className="earnings-icon">📅</span>
            <span className="earnings-date">{data.nextEarnings.date}</span>
            {data.nextEarnings.epsEstimate != null && (
              <span className="earnings-estimate">EPS таамаг: {data.nextEarnings.epsEstimate}</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
