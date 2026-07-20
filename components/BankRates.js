"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/lib/i18n/I18nContext";

const LABELS = {
  mn: { title: "Банкны ханш", currency: "Валют", buy: "Авах", sell: "Зарах", loading: "Ачаалж байна...", empty: "Мэдээлэл олдсонгvй." },
  en: { title: "Bank rates", currency: "Currency", buy: "Buy", sell: "Sell", loading: "Loading...", empty: "No data found." },
};

export default function BankRates() {
  const [rows, setRows] = useState([]);
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
        setRows(data);
        setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return <p className="bank-rates-loading">{L.loading}</p>;
  if (status === "empty") return null;

  const banks = [...new Set(rows.map((r) => r.bank))];
  const currencies = [...new Set(rows.map((r) => r.currency))];

  function getRate(bank, currency, field) {
    const row = rows.find((r) => r.bank === bank && r.currency === currency);
    return row ? row[field] : null;
  }

  return (
    <section className="bank-rates-section">
      <h2>{L.title}</h2>
      <table className="bank-rates-table">
        <thead>
          <tr>
            <th>{L.currency}</th>
            {banks.map((bank) => (
              <th key={bank} colSpan={2}>{bank}</th>
            ))}
          </tr>
          <tr>
            <th></th>
            {banks.map((bank) => (
              <>
                <th key={bank + "-buy"}>{L.buy}</th>
                <th key={bank + "-sell"}>{L.sell}</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {currencies.map((currency) => (
            <tr key={currency}>
              <td>{currency}</td>
              {banks.map((bank) => (
                <>
                  <td key={bank + "-buy-" + currency} className="bank-rates-best">
                    {getRate(bank, currency, "buy_rate") ?? "—"}
                  </td>
                  <td key={bank + "-sell-" + currency} className="bank-rates-best">
                    {getRate(bank, currency, "sell_rate") ?? "—"}
                  </td>
                </>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
