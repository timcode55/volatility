"use client";

import { useEffect, useState } from "react";

const indicators = [
  { label: "VIX", ticker: "^VIX" },
  { label: "VXV (3M VIX)", ticker: "^VXV" },
  { label: "Put/Call Ratio", ticker: "$PCALL" },
  { label: "SPY", ticker: "SPY" },
];

export default function Home() {
  const [data, setData] = useState({});

  useEffect(() => {
    // Static mock data — replace with real API later
    const dummyData = {
      "^VIX": 49.83,
      "^VXV": 41.02,
      $PCALL: 1.78,
      SPY: 411.75,
    };
    setData(dummyData);
  }, []);

  const ratio =
    data["^VIX"] && data["^VXV"]
      ? (data["^VIX"] / data["^VXV"]).toFixed(2)
      : null;

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>
        📉 Buy-the-Dip Dashboard
      </h1>
      <div style={{ display: "grid", gap: 20 }}>
        {indicators.map((ind) => (
          <div
            key={ind.ticker}
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}
          >
            <strong>{ind.label}</strong>
            <div style={{ fontSize: 24 }}>{data[ind.ticker]}</div>
          </div>
        ))}
        {ratio && (
          <div
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}
          >
            <strong>VIX / VXV Ratio</strong>
            <div style={{ fontSize: 24 }}>{ratio}</div>
          </div>
        )}
      </div>
    </div>
  );
}
