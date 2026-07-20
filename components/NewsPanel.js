"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";

const SENTIMENT_LABEL = {
  mn: { positive: "Эерэг", negative: "Сөрөг", neutral: "Төвийг сахисан" },
  en: { positive: "Positive", negative: "Negative", neutral: "Neutral" },
};

export default function NewsPanel({ ticker, type = "stock", nameHint }) {
  const { lang, t } = useI18n();
  const [status, setStatus] = useState("loading");
  const [items, setItems] = useState([]);
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    const nameParam = nameHint ? `&name=${encodeURIComponent(nameHint)}` : "";
    fetch(`/api/news?symbol=${encodeURIComponent(ticker)}&type=${type}&lang=${lang}${nameParam}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok || !data.items || !data.items.length) {
          setStatus("empty");
          return;
        }
        setItems(data.items);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [ticker, type, lang, nameHint]);

  const labels = SENTIMENT_LABEL[lang] || SENTIMENT_LABEL.mn;

  return (
    <div className="news-section">
      <div className="news-title">{t("news_title")}</div>
      {status === "loading" && <div className="loading">{t("news_loading")}</div>}
      {status === "empty" && <div className="news-empty">{t("news_empty")}</div>}
      {status === "error" && <div className="news-empty">{t("news_error")}</div>}
      {status === "ready" &&
        items.map((n, i) => (
          <a key={i} className="news-item" href={n.url} target="_blank" rel="noopener noreferrer">
            <div className="news-headline-row">
              <div className="news-headline">{n.headline}</div>
              {n.sentiment && (
                <span className={`news-sentiment-badge ${n.sentiment}`}>
                  {labels[n.sentiment]}
                </span>
              )}
            </div>
            <div className="news-sub">{n.summary}</div>
          </a>
        ))}
      {status === "ready" && <div className="news-footnote">{t("news_footnote")}</div>}
    </div>
  );
}
