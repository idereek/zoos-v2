"use client";
import { useState } from "react";
import { useSession } from "@/lib/useSession";
import { useAuthModal } from "@/lib/AuthModalContext";

const PLANS = [
  {
    key: "free",
    name: "Free",
    features: [
      "Chart, vнэ, мэдээ vзэх",
      "Аналистуудын нийтлэг санал vзэх",
      "Дэлгэрэнгvй шинжилгээ (бvртгvvлсний дараа)",
      "'Миний ДАНС' (портфолио) хөтлөх",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    trialDays: 3,
    monthly: 20,
    annual: 200,
    features: [
      "Free-ийн бvх боломж",
      "Vнийн сэрэмжлvvлэг тохируулах",
      "3 хоног vнэгvй туршилт",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    trialDays: 2,
    monthly: 35,
    annual: 360,
    features: [
      "Basic-ийн бvх боломж",
      "2 хоног vнэгvй туршилт",
      "Дэвшилтэт feature-vvд (тун удахгvй)",
    ],
  },
];

export default function PricingPage() {
  const { user } = useSession();
  const { openAuthModal } = useAuthModal();
  const [period, setPeriod] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");

  async function handleSubscribe(planKey) {
    if (planKey === "free") {
      if (!user) openAuthModal("signup");
      return;
    }
    if (!user) {
      openAuthModal("signup");
      return;
    }
    setError("");
    setLoadingPlan(planKey);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey,
          period,
          userId: user.id,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Алдаа гарлаа");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Алдаа гарлаа");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="pricing-wrap">
      <h1 className="pricing-title">Багц сонгох</h1>

      <div className="pricing-period-toggle">
        <button
          className={`period-btn${period === "monthly" ? " active" : ""}`}
          type="button"
          onClick={() => setPeriod("monthly")}
        >
          Сард
        </button>
        <button
          className={`period-btn${period === "annual" ? " active" : ""}`}
          type="button"
          onClick={() => setPeriod("annual")}
        >
          Жилд
        </button>
      </div>

      {error && <div className="pricing-error">{error}</div>}

      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const price = plan.key === "free" ? 0 : plan[period];
          return (
            <div key={plan.key} className={`pricing-card${plan.key === "pro" ? " featured" : ""}`}>
              <h2 className="pricing-card-name">{plan.name}</h2>
              <div className="pricing-card-price">
                {plan.key === "free" ? (
                  <span className="price-amount">$0</span>
                ) : (
                  <>
                    <span className="price-amount">${price}</span>
                    <span className="price-period">/{period === "monthly" ? "сар" : "жил"}</span>
                  </>
                )}
              </div>
              {plan.trialDays && (
                <div className="pricing-trial">{plan.trialDays} хоног vнэгvй</div>
              )}
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className="pricing-cta"
                type="button"
                disabled={loadingPlan === plan.key}
                onClick={() => handleSubscribe(plan.key)}
              >
                {plan.key === "free"
                  ? "Бvртгvvлэх"
                  : loadingPlan === plan.key
                  ? "Түр хvлээнэ vv..."
                  : "Сонгох"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
