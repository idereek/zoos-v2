"use client";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function AnalysisPanel({ quote }) {
  const { t } = useI18n();

  if (!quote) return null;

  const { current, open, high, low, percent } = quote;
  const up = percent >= 0;

  const range = high - low;
  let gaugePct = 50;
  if (range > 0) {
    gaugePct = ((current - low) / range) * 100;
    gaugePct = Math.max(0, Math.min(100, gaugePct));
  }

  let posLabel = t("analysis_pos_mid");
  if (gaugePct >= 75) posLabel = t("analysis_pos_high");
  else if (gaugePct <= 25) posLabel = t("analysis_pos_low");

  const vsOpenPct = open ? ((current - open) / open) * 100 : 0;
  const vsOpenUp = vsOpenPct >= 0;

  const trendWord = up ? t("analysis_trend_word_up") : t("analysis_trend_word_down");

  return (
    <div className="analysis-section">
      <div className="analysis-header">
        <span className="analysis-title">{t("analysis_title")}</span>
        <span className={`analysis-trend-pill ${up ? "up" : "down"}`}>
          {up ? t("analysis_trend_up") : t("analysis_trend_down")}
        </span>
      </div>

      <div className="analysis-gauge">
        <div className="gauge-track">
          <div className="gauge-marker" style={{ left: `${gaugePct}%` }} />
        </div>
        <div className="gauge-labels">
          <span>
            {t("analysis_label_low")}
            <b>${low?.toFixed(2)}</b>
          </span>
          <span>
            {t("analysis_label_high")}
            <b>${high?.toFixed(2)}</b>
          </span>
        </div>
      </div>

      <div className="analysis-chips">
        <div className="analysis-chip">
          <span className="chip-label">{t("analysis_range_label")}</span>
          <span className="chip-val">
            ${low?.toFixed(2)} – ${high?.toFixed(2)}
          </span>
        </div>
        <div className="analysis-chip">
          <span className="chip-label">{t("analysis_vs_open_label")}</span>
          <span className={`chip-val ${vsOpenUp ? "up-text" : "down-text"}`}>
            {vsOpenUp ? "+" : ""}
            {vsOpenPct.toFixed(2)}% ({vsOpenUp ? t("analysis_above") : t("analysis_below")})
          </span>
        </div>
      </div>

      <p className="analysis-body">
        {quote.symbol} {trendWord} байна, {posLabel}.
      </p>

      <p className="analysis-disclaimer">{t("analysis_disclaimer")}</p>
    </div>
  );
}
