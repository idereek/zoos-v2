"use client";
import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Алдаа гарлаа");
      }
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err.message || "Алдаа гарлаа");
      setStatus("idle");
    }
  }

  return (
    <div className="contact-wrap">
      <h1 className="contact-title">Холбоо барих</h1>
      <p className="contact-subtitle">
        Асуулт, санал хvсэлт байвал доорх маягтыг бөглөнө vv.
      </p>

      {status === "sent" ? (
        <div className="contact-success">
          ✅ Таны зурвас амжилттай илгээгдлээ. Бид тантай удахгvй холбогдох болно.
        </div>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit}>
          <label className="contact-label">
            Нэр
            <input
              type="text"
              className="contact-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="contact-label">
            Имэйл
            <input
              type="email"
              className="contact-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="contact-label">
            Зурвас
            <textarea
              className="contact-textarea"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </label>
          {error && <div className="contact-error">{error}</div>}
          <button className="contact-submit" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Илгээж байна..." : "Илгээх"}
          </button>
        </form>
      )}
    </div>
  );
}
