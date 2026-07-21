"use client";
import { useState } from "react";
import { addAlert } from "@/lib/priceAlerts";

export default function PriceAlertForm({ userId, ticker, assetType, currentPrice, onAdded }) {
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState("above");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) {
      setError("Vнийг зөв оруулна уу.");
      return;
    }
    setSubmitting(true);
    try {
      await addAlert(userId, { ticker, assetType, targetPrice: price, direction });
      setTargetPrice("");
      setSuccess(true);
      onAdded?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="analyst-card alert-form-card">
      <h3 className="analyst-card-title">ҮНИЙН СИГНАЛ ТОХИРУУЛАХ</h3>
      <form className="alert-form" onSubmit={handleSubmit}>
        <select
          className="alert-select"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        >
          <option value="above">Дээш давахад</option>
          <option value="below">Доош унахад</option>
        </select>
        <div className="alert-current-price">Одоо VНЭ: ${currentPrice}</div>
        <div className="alert-target-field">
          <label className="alert-target-label">Сигнал авах үнэ</label>
          <input
            type="number"
            step="any"
            className="alert-input"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
          />
        </div>
        <button className="alert-submit" type="submit" disabled={submitting}>
          {submitting ? "..." : "Тохируулах"}
        </button>
      </form>
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">✅ Сэрэмжлvvлэг vvсгэгдлээ</div>}
    </div>
  );
}
