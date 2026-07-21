"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/lib/i18n/I18nContext";

const LABELS = {
  mn: { title: "Банкны ханш", currency: "Валют", buy: "Авах", sell: "Зарах", loading: "Ачаалж байна...", empty: "Мэдээлэл олдсонгvй." },
  en: { title: "Bank rates", currency: "Currency", buy: "Buy", sell: "Sell", loading: "Loading...", empty: "No data found." },
};

export default function BankRates() {
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState("loading");
  const { lang } = useI18n();
  const L = LABELS[lang] || LABELS.mn;

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("bank_rates")
      .select("*")
      .order("bank", { ascending: true })
      .order("currency", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || !data.length) {
          setStatus("empty");
          return;
        }
        const normalized = data.map((r) => ({
          id: r.id,
          bankKey: r.bank,
          bankLabel: r.bank_name_mn || r.bank,
          currency: r.currency,
          buy: r.buy_cash ?? r.buy_rate ?? r.official ?? null,
          sell: r.sell_cash ?? r.sell_rate ?? r.official ?? null,
        }));

        const byBank = {};
        normalized.forEach((r) => {
          if (!byBank[r.bankKey]) {
            byBank[r.bankKey] = { bankLabel: r.bankLabel, items: [] };
          }
          byBank[r.bankKey].items.push(r);
        });

        setGroups(Object.values(byBank));
        setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return <p className="bank-rates-loading">{L.loading}</p>;
  if (status === "empty") return null;

  return (
    <section className="bank-rates-section">
      <h2>{L.title}</h2>
      {groups.map((group) => (
        <div className="bank-rates-group" key={group.bankLabel}>
          <h3 className="bank-rates-bank-name">{group.bankLabel}</h3>
          <table className="bank-rates-table">
            <thead>
              <tr>
                <th>{L.currency}</th>
                <th>{L.buy}</th>
                <th>{L.sell}</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((r) => (
                <tr key={r.id}>
                  <td>{r.currency}</td>
                  <td className="bank-rates-best">{r.buy != null ? r.buy : "—"}</td>
                  <td className="bank-rates-best">{r.sell != null ? r.sell : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
