"use client";
import React, { useEffect, useState } from "react";
import fetchData from "../../utils/fetchData";

const indicators = [
  { label: "VIX", symbol: "^VIX" },
  { label: "VXV (3M VIX)", symbol: "^VXV" },
  { label: "Put/Call Ratio", symbol: "^PCR" },
  { label: "SPY", symbol: "SPY" },
];

const Dashboard = () => {
  const [data, setData] = useState({});
  const [recommendation, setRecommendation] = useState({
    message: "Loading...",
    color: "gray",
  });

  useEffect(() => {
    fetchData()
      .then((fetchedData) => {
        setData(fetchedData);

        const vix = fetchedData["^VIX"]?.regularMarketPrice;
        const vxv = fetchedData["^VXV"]?.regularMarketPrice;
        const vixVxvRatio = vix && vxv ? vix / vxv : null;

        // Recommendation logic
        if (vix > 30 && vixVxvRatio > 1) {
          setRecommendation({
            message: "Consider buying: High volatility detected.",
            color: "green",
          });
        } else {
          setRecommendation({
            message: "No buy signals detected.",
            color: "black",
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const vix = data["^VIX"]?.regularMarketPrice;
  const vxv = data["^VXV"]?.regularMarketPrice;
  const vixVxvRatio = vix && vxv ? (vix / vxv).toFixed(2) : null;

  const getIndicatorStyle = (label, value) => {
    if (label === "VIX" && value > 30) return { color: "red" };
    if (label === "VIX" && value < 20) return { color: "green" };
    if (label === "VIX/VXV Ratio" && value > 1) return { color: "red" };
    return {};
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>
        📉 Buy-the-Dip Dashboard
      </h1>
      <div style={{ display: "grid", gap: 20 }}>
        {indicators.map((indicator) => {
          const value = data[indicator.symbol]?.regularMarketPrice;
          return (
            <div
              key={indicator.symbol}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 16,
                ...getIndicatorStyle(indicator.label, value),
              }}
            >
              <strong>{indicator.label}</strong>
              <div style={{ fontSize: 24 }}>
                {value !== undefined ? value : "Loading..."}
              </div>
            </div>
          );
        })}
        {vixVxvRatio && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 16,
              ...getIndicatorStyle("VIX/VXV Ratio", vixVxvRatio),
            }}
          >
            <strong>VIX/VXV Ratio</strong>
            <div style={{ fontSize: 24 }}>{vixVxvRatio}</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 20, color: recommendation.color }}>
        <strong>Recommendation:</strong> {recommendation.message}
      </div>
    </div>
  );
};

export default Dashboard;
