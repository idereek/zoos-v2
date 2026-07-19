"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("bitcoin");
  const [data, setData] = useState<any>(null);
  const [ai, setAi] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!query) return;

    setLoading(true);

    try {
      const asset = query.toLowerCase();

      // 💰 PRICE API
      const res = await fetch(`/api/price?id=${asset}`);
      const result = await res.json();

      setData(result);

      // 🤖 AI API (mock or future Claude)
      const aiRes = await fetch(`/api/ai?id=${asset}`);
      const aiResult = await aiRes.json();

      setAi(aiResult);
    } catch (err) {
      console.log("Error:", err);
    }

    setLoading(false);
  };

  // ⚙️ IMPORTANT: backend now returns flat structure
  const price = data?.usd;
  const change = data?.usd_24h_change;
  const assetName = data?.asset || query;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Crypto & Stock AI Dashboard</h1>

      {/* INPUT */}
      <div style={styles.searchBox}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="bitcoin, tesla, apple"
          style={styles.input}
        />

        <button onClick={fetchData} style={styles.button}>
          Analyze
        </button>
      </div>

      {loading && <p style={styles.loading}>Loading...</p>}

      {/* PRICE CARD */}
      {data && !data.error && (
        <div style={styles.card}>
          <h2 style={styles.asset}>{assetName.toUpperCase()}</h2>

          <p style={styles.price}>
            {price ? `$${price}` : "--"}
          </p>

          <p
            style={{
              ...styles.change,
              color:
                typeof change === "number"
                  ? change >= 0
                    ? "green"
                    : "red"
                  : "#000",
            }}
          >
            {typeof change === "number"
              ? `${change.toFixed(2)}% (24h)`
              : "--"}
          </p>
        </div>
      )}

      {/* ❌ ERROR STATE */}
      {data?.error && (
        <div style={styles.card}>
          <p style={{ color: "red" }}>{data.error}</p>
        </div>
      )}

      {/* 🤖 AI INSIGHT */}
      {ai && (
        <div style={styles.card}>
          <h3>🤖 AI Insight</h3>

          <p>
            <b>Sentiment:</b> {ai.sentiment}
          </p>

          <p>
            <b>Risk:</b> {ai.risk}
          </p>

          <p style={{ marginTop: 10 }}>{ai.summary}</p>
        </div>
      )}
    </div>
  );
}

/* 🎨 STYLES */
const styles: any = {
  container: {
    padding: 40,
    fontFamily: "sans-serif",
    background: "#ffffff",
    minHeight: "100vh",
    color: "#111",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  searchBox: {
    display: "flex",
    gap: 10,
  },
  input: {
    padding: 10,
    width: 250,
    borderRadius: 6,
    border: "1px solid #ddd",
  },
  button: {
    padding: "10px 15px",
    cursor: "pointer",
    background: "#111",
    color: "#fff",
    borderRadius: 6,
    border: "none",
  },
  loading: {
    marginTop: 20,
  },
  card: {
    marginTop: 40,
    padding: 20,
    background: "#f7f7f7",
    borderRadius: 10,
    width: 320,
    border: "1px solid #eee",
  },
  asset: {
    marginBottom: 10,
  },
  price: {
    fontSize: 28,
    marginBottom: 10,
  },
  change: {
    fontSize: 18,
  },
};