"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/lib/i18n/I18nContext";

const LABELS = {
  mn: { title: "Банкны ханш", currency: "ВАЛЮТ", buy: "Авах", sell: "Зарах", loading: "Ачаалж байна...", empty: "Мэдээлэл олдсонгvй." },
  en: { title: "Bank rates", currency: "CURRENCY", buy: "Buy", sell: "Sell", loading: "Loading...", empty: "No data found." },
};

const BANK_ORDER = [
  { key: "mongolbank", label: "Монголбанк" },
  { key: "ХХБанк", label: "ХХБанк (ХХБ)" },
  { key: "Голомт", label: "Голомт Банк" },
  { key: "ХААН", label: "ХААН Банк" },
  { key: "Төрийн банк", label: "Төрийн Банк" },
];

const CURRENCY_ORDER = ["USD", "EUR", "GBP", "CAD", "AUD", "CNY", "RUB", "KRW"];

export default function BankRates() {
  const [dataByBank, setDataByBank] = useState({});
  const [status, setStatus] = useState("loading");
  const { lang } = useI18n();
  const L = LABELS[lang] || LABELS.mn;

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("bank_rates")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || !data.length) {
          setStatus("empty");
          return;
        }
        const byBank = {};
        data.forEach((r) => {
          const buy = r.buy_cash ?? r.buy_rate ?? r.official ?? null;
          const sell = r.sell_cash ?? r.sell_rate ?? r.official ?? null;
          if (!byBank[r.bank]) byBank[r.bank] = {};
          byBank[r.bank][r.currency] = { buy, sell };
        });
        setDataByBank(byBank);
        setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return <p className="bank-rates-loading">{L.loading}</p>;
  if (status === "empty") return null;

  const activeBanks = BANK_ORDER.filter((b) => dataByBank[b.key]);
  if (!activeBanks.length) return null;

  return (
    <section className="bank-rates-section">
      <h2>{L.title}</h2>
      <div className="bank-rates-table-wrap">
        <table className="bank-rates-table">
          <thead>
            <tr>
              <th>{L.currency}</th>
              {activeBanks.map((b) => (
                <th key={b.key} colSpan={2}>{b.label}</th>
              ))}
            </tr>
            <tr>
              <th></th>
              {activeBanks.map((b) => (
                <>
                  <th key={b.key + "-buy"}>{L.buy}</th>
                  <th key={b.key + "-sell"}>{L.sell}</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {CURRENCY_ORDER.map((currency) => (
              <tr key={currency}>
                <td>{currency}</td>
                {activeBanks.map((b) => {
                  const rate = dataByBank[b.key]?.[currency];
                  return (
                    <>
                      <td key={b.key + "-buy-" + currency} className="bank-rates-best">
                        {rate?.buy != null ? rate.buy : "—"}
                      </td>
                      <td key={b.key + "-sell-" + currency} className="bank-rates-best">
                        {rate?.sell != null ? rate.sell : "—"}
                      </td>
                    </>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
