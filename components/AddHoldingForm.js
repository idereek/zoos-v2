"use client";
import { useState } from "react";
import { getAssetType } from "@/lib/assetType";
import { addHolding } from "@/lib/portfolio";

export default function AddHoldingForm({ userId, onAdded }) {
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDate, setBuyDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmedTicker = ticker.trim().toUpperCase();
    const qty = parseFloat(quantity);
    const price = parseFloat(buyPrice);

    if (!trimmedTicker || !qty || qty <= 0 || !price || price < 0) {
      setError("Ticker, тоо ширхэг, худалдан авсан vнийг зөв бөглөнө vv.");
      return;
    }

    setSubmitting(true);
    try {
      const assetType = getAssetType(trimmedTicker);
      await addHolding(userId, {
        ticker: trimmedTicker,
        assetType,
        quantity: qty,
        buyPrice: price,
        buyDate,
      });
      setTicker("");
      setQuantity("");
      setBuyPrice("");
      setBuyDate("");
      onAdded();
    } catch (err) {
      setError(err.message || "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="holding-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Ticker (жишээ: AAPL)"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        className="holding-input"
      />
      <input
        type="number"
        step="any"
        placeholder="Тоо ширхэг"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="holding-input"
      />
      <input
        type="number"
        step="any"
        placeholder="Худалдан авсан vнэ ($)"
        value={buyPrice}
        onChange={(e) => setBuyPrice(e.target.value)}
        className="holding-input"
      />
      <input
        type="date"
        value={buyDate}
        onChange={(e) => setBuyDate(e.target.value)}
        className="holding-input"
      />
      <button className="holding-submit" type="submit" disabled={submitting}>
        {submitting ? "Нэмж байна..." : "Нэмэх"}
      </button>
      {error && <div className="holding-error">{error}</div>}
    </form>
  );
}
