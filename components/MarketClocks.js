"use client";

import { createElement, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nContext";

const CITIES = [
  { key: "ub", name_mn: "УЛААНБААТАР", name_en: "ULAANBAATAR", tz: "Asia/Ulaanbaatar", market: { open: 10, close: 13 }, exchange_mn: "МХБ", exchange_en: "MSE", exchangeUrl: "https://mse.mn" },
  { key: "hk", name_mn: "ХОНГ КОНГ", name_en: "HONG KONG", tz: "Asia/Hong_Kong", market: { open: 9.5, close: 16 }, exchange_mn: "HKEX", exchange_en: "HKEX", exchangeUrl: "https://www.hkex.com.hk" },
  { key: "tokyo", name_mn: "ТОКИО", name_en: "TOKYO", tz: "Asia/Tokyo", market: { open: 9, close: 15 }, exchange_mn: "JPX", exchange_en: "JPX", exchangeUrl: "https://www.jpx.co.jp" },
  { key: "frankfurt", name_mn: "ФРАНКФУРТ", name_en: "FRANKFURT", tz: "Europe/Berlin", market: { open: 9, close: 17.5 }, exchange_mn: "Deutsche Börse", exchange_en: "Deutsche Börse", exchangeUrl: "https://www.deutsche-boerse.com" },
  { key: "london", name_mn: "ЛОНДОН", name_en: "LONDON", tz: "Europe/London", market: { open: 8, close: 16.5 }, exchange_mn: "LSE", exchange_en: "LSE", exchangeUrl: "https://www.londonstockexchange.com" },
  { key: "ny", name_mn: "НЬЮ-ЙОРК", name_en: "NEW YORK", tz: "America/New_York", market: { open: 9.5, close: 16 }, exchange_mn: "NYSE", exchange_en: "NYSE", exchangeUrl: "https://www.nyse.com" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const MN_WEEKDAY = {
  Mon: "Даваа", Tue: "Мягмар", Wed: "Лхагва", Thu: "Пvрэв",
  Fri: "Баасан", Sat: "Бямба", Sun: "Ням",
};

const MARKET_STATUS = {
  mn: { open: "БИРЖ НЭЭЛТТЭЙ", closed: "БИРЖ ХААЛТТАЙ" },
  en: { open: "MARKET OPEN", closed: "MARKET CLOSED" },
};

function getTimeParts(timeZone) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour12: false, hour: "2-digit", minute: "2-digit",
    second: "2-digit", weekday: "short", month: "numeric", day: "numeric",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const weekday = parts.find((p) => p.type === "weekday").value;
  return { h: get("hour") % 24, m: get("minute"), s: get("second"), weekday, month: get("month"), day: get("day") };
}

function formatDateLabel(month, day, weekday, lang) {
  if (lang === "en") {
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const weekdayFull = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
    return `${monthNames[month - 1]} ${day}, ${weekdayFull[weekday] || weekday}`;
  }
  const weekdayMn = MN_WEEKDAY[weekday] || weekday;
  return `${month}-р сарын ${day}, ${weekdayMn}`;
}

function ClockFace({ hourDeg, minDeg, secDeg }) {
  return (
    <svg className="wc-face" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="var(--panel)" stroke="var(--gold)" strokeWidth="2" />
      <g stroke="var(--text-dim)" strokeWidth="1.4" strokeLinecap="round">
        <line x1="32" y1="5" x2="32" y2="9" />
        <line x1="32" y1="55" x2="32" y2="59" />
        <line x1="5" y1="32" x2="9" y2="32" />
        <line x1="55" y1="32" x2="59" y2="32" />
      </g>
      <line x1="32" y1="32" x2="32" y2="18" stroke="var(--text)" strokeWidth="2.6" strokeLinecap="round" transform={`rotate(${hourDeg} 32 32)`} />
      <line x1="32" y1="32" x2="32" y2="11" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${minDeg} 32 32)`} />
      <line x1="32" y1="32" x2="32" y2="9" stroke="var(--loss)" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 32 32)`} />
      <circle cx="32" cy="32" r="2.4" fill="var(--gold)" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="wc-search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function WorldClocksStrip() {
  const [mounted, setMounted] = useState(false);
  const { lang } = useI18n();

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setMounted((v) => v), 1000);
    return () => clearInterval(interval);
  }, []);

  function renderExchangeRow(c, dateLabel) {
    const exchangeLabel = lang === "en" ? c.exchange_en : c.exchange_mn;
    return (
      <span className="wc-exchange-row">
        {createElement("a", { className: "wc-exchange-link", href: c.exchangeUrl, target: "_blank", rel: "noopener noreferrer" }, exchangeLabel)}
        {dateLabel && (<><span className="wc-date-sep">·</span><span className="wc-date">{dateLabel}</span></>)}
      </span>
    );
  }

  return (
    <div className="world-clocks-strip">
      {CITIES.map((c) => {
        const cityLabel = lang === "en" ? c.name_en : c.name_mn;
        if (!mounted) {
          return (
            <div className="wc-item" key={c.key} aria-hidden="true">
              <div className="wc-face-wrap"><ClockFace hourDeg={0} minDeg={0} secDeg={0} /></div>
              <div className="wc-info">
                <span className="wc-city-row"><span className="wc-city">{cityLabel}</span></span>
                <span className="wc-digital"><span>--</span><span className="wc-colon">:</span><span>--</span><span className="wc-ampm">--</span></span>
                {c.market && (<span className="wc-market-badge closed"><span>{MARKET_STATUS[lang].closed}</span></span>)}
                {(c.exchange_mn || c.exchange_en) && renderExchangeRow(c, "")}
              </div>
            </div>
          );
        }
        let h = 0, m = 0, s = 0, weekday = "Mon", month = 1, day = 1;
        try { ({ h, m, s, weekday, month, day } = getTimeParts(c.tz)); } catch (err) {}
        const dateLabel = formatDateLabel(month, day, weekday, lang);
        const hourDeg = (h % 12) * 30 + m * 0.5;
        const minDeg = m * 6 + s * 0.1;
        const secDeg = s * 6;
        let hour12 = h % 12;
        if (hour12 === 0) hour12 = 12;
        const ampm = h < 12 ? "AM" : "PM";
        let isOpen = false;
        if (c.market) {
          const decimalHour = h + m / 60;
          const isWeekday = WEEKDAYS.includes(weekday);
          isOpen = isWeekday && decimalHour >= c.market.open && decimalHour < c.market.close;
        }
        return (
          <div className="wc-item" key={c.key}>
            <div className="wc-face-wrap"><ClockFace hourDeg={hourDeg} minDeg={minDeg} secDeg={secDeg} /></div>
            <div className="wc-info">
              <span className="wc-city-row"><span className="wc-city">{cityLabel}</span></span>
              <span className="wc-digital">
                <span>{String(hour12).padStart(2, "0")}</span><span className="wc-colon">:</span>
                <span>{String(m).padStart(2, "0")}</span><span className="wc-ampm">{ampm}</span>
              </span>
              {c.market && (
                <span className={`wc-market-badge ${isOpen ? "open" : "closed"}`}>
                  {isOpen && <span className="wc-market-flash" />}
                  <span>{isOpen ? MARKET_STATUS[lang].open : MARKET_STATUS[lang].closed}</span>
                </span>
              )}
              {(c.exchange_mn || c.exchange_en) && renderExchangeRow(c, dateLabel)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HeroTitle() {
  const { lang } = useI18n();
  const pathname = usePathname();

  if (pathname !== "/") {
    return null;
  }

  const heroTitle = lang === "en" ? (
    <>Read the stock market <span className="accent-text">in your language</span></>
  ) : (
    <>Хөрөнгийн зах зээлийг <span className="accent-text">эх хэлээрээ</span> уншъя</>
  );

  return (
    <div className="wc-search-row">
      <h1 className="wc-hero-title">{heroTitle}</h1>
    </div>
  );
}
