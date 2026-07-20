"use client";

import { createElement, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    <svg
