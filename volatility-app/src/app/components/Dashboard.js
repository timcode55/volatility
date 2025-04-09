// File: components/Dashboard.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
// Import the CSS module
import styles from "./Dashboard.module.css";

// (Keep the IndicatorCard component definition from below)

export default function Dashboard() {
  const [marketData, setMarketData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get current Date, Time, Location
  const locationInfo = "Pearland, Texas, United States"; // From context
  const currentDateTimeString = currentTime.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "America/Chicago", // CDT - Adjust timezone as needed
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/yahoo");
      const responseText = await response.text();

      if (!response.ok) {
        let errorPayload = {
          message: `HTTP error! Status: ${response.status} ${response.statusText}`,
        };
        try {
          const result = JSON.parse(responseText);
          errorPayload = {
            message: result.error || errorPayload.message,
            details: result.details,
          };
        } catch (parseError) {
          errorPayload.details = `Could not parse error response. Raw response: ${responseText.substring(
            0,
            200
          )}...`;
        }
        throw new Error(errorPayload.message, { cause: errorPayload.details });
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Failed to parse successful response from API.", {
          cause: parseError,
        });
      }

      setMarketData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message || "An unknown error occurred while fetching data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const refreshInterval = 60000 * 2;
    const intervalId = setInterval(() => fetchData(), refreshInterval);
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(intervalId);
      clearInterval(timerId);
    };
  }, [fetchData]);

  // --- Rendering Logic ---
  const renderLoadingSkeleton = () => (
    // Basic text loading, or you could build a skeleton with divs and styles.loadingSkeleton
    <div className={styles.loadingText}>
      Loading market data... Please wait.
    </div>
  );

  const renderContent = () => {
    if (isLoading && !marketData && !error) {
      return renderLoadingSkeleton();
    }

    if (error && !marketData) {
      return (
        <div className={styles.errorBox}>
          <strong>Error Loading Data: </strong>
          <span>{error}</span>
        </div>
      );
    }

    if (!isLoading && !marketData && !error) {
      return (
        <p className={styles.unavailableText}>
          No market data received from API.
        </p>
      );
    }

    if (marketData) {
      const { vix, market, signal } = marketData;
      const isBuySignal = signal.isBuySignal;
      const hasRefreshError = error && !isLoading;

      // Dynamically set signal box classes
      const signalBoxClasses = `${styles.signalBox} ${
        isBuySignal ? styles.signalBoxBuy : styles.signalBoxNeutral
      }`;
      const signalText = isBuySignal
        ? "BUY SIGNAL (High Fear)"
        : "NEUTRAL / HOLD (Fear Below Threshold)";

      return (
        <div className={styles.contentWrapper}>
          {isLoading && (
            <div className={styles.loadingText}>
              <svg
                className={styles.loadingSpinner}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  style={{ opacity: 0.25 }}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  style={{ opacity: 0.75 }}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Refreshing data...
            </div>
          )}

          {hasRefreshError && (
            <div className={styles.errorBox}>
              <strong>Warning:</strong> Failed to refresh data. Displaying last
              known values. (Error: {error})
            </div>
          )}

          {/* Buy Signal Status Card */}
          <div className={signalBoxClasses}>
            <h3 className={styles.signalBoxTitle}>{signalText}</h3>
            <p className={styles.signalBoxReason}>{signal.reason}</p>
          </div>

          {/* Main Data Area */}
          <div className={styles.dataGrid}>
            {/* VIX Data Section */}
            <div className={styles.dataSection}>
              <h2 className={styles.dataSectionTitle}>
                VIX Volatility ({vix?.symbol || "^VIX"})
              </h2>
              {vix ? (
                <div className={styles.indicatorGrid}>
                  <IndicatorCard
                    title="Current VIX"
                    value={vix.currentPriceFormatted}
                  />
                  <IndicatorCard
                    title="VIX Change"
                    value={`${vix.changeFormatted} (${vix.changePercentFormatted}%)`}
                    change={vix.change}
                  />
                  <IndicatorCard
                    title="VIX Open"
                    value={vix.openPriceFormatted}
                  />
                  <IndicatorCard
                    title="VIX Day High"
                    value={vix.dayHighFormatted}
                  />
                  <IndicatorCard
                    title="VIX Day Low"
                    value={vix.dayLowFormatted}
                  />
                  <IndicatorCard
                    title="VIX Prev Close"
                    value={vix.previousCloseFormatted}
                  />
                </div>
              ) : (
                <p className={styles.unavailableText}>VIX data unavailable.</p>
              )}
            </div>

            {/* Market Context Section */}
            <div className={styles.dataSection}>
              <h2 className={styles.dataSectionTitle}>
                Market Context ({market?.name || "Market"} -{" "}
                {market?.symbol || "N/A"})
              </h2>
              {market ? (
                <div className={styles.indicatorGrid}>
                  <IndicatorCard
                    title="Current Price"
                    value={market.currentPriceFormatted}
                  />
                  <IndicatorCard
                    title="Change"
                    value={`${market.changeFormatted} (${market.changePercentFormatted}%)`}
                    change={market.change}
                  />
                  <IndicatorCard
                    title="Open"
                    value={market.openPriceFormatted}
                  />
                  <IndicatorCard
                    title="Day High"
                    value={market.dayHighFormatted}
                  />
                  <IndicatorCard
                    title="Day Low"
                    value={market.dayLowFormatted}
                  />
                  <IndicatorCard
                    title="Volume"
                    value={market.volumeFormatted}
                  />
                </div>
              ) : (
                <p className={styles.unavailableText}>
                  Market context data unavailable.
                </p>
              )}
            </div>
          </div>

          {/* Footer Area */}
          <div className={styles.footer}>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className={styles.refreshButton}
            >
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </button>
            {lastUpdated && (
              <p className={styles.lastUpdated}>
                API Data Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      );
    }
    return <p className={styles.unavailableText}>Unable to display data.</p>;
  };

  return (
    <div className={styles.pageWrapper}>
      {" "}
      {/* Apply page background */}
      <div className={styles.dashboardContainer}>
        {" "}
        {/* Apply container styles */}
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.mainTitle}>Market Volatility & Fear Signal</h1>
          <p className={styles.locationTime}>
            {currentDateTimeString} - {locationInfo}
          </p>
        </div>
        {/* Main Content Area */}
        {renderContent()}
        {/* Disclaimer */}
        <p className={styles.disclaimer}>
          Disclaimer: This tool uses the VIX index level (threshold:{" "}
          {marketData?.signal?.threshold ?? "N/A"}) as a basic contrarian
          indicator. High VIX does not guarantee a market bottom. For
          informational purposes only. <strong>Not financial advice</strong>.
          Market data provided via Yahoo Finance API.
        </p>
      </div>
    </div>
  );
}

// Updated IndicatorCard component using CSS Modules
function IndicatorCard({ title, value, change }) {
  const numericChange = typeof change === "number" ? change : undefined;
  let valueClasses = styles.indicatorValue; // Base class

  if (numericChange !== undefined) {
    if (numericChange > 0) valueClasses += ` ${styles.valuePositive}`;
    else if (numericChange < 0) valueClasses += ` ${styles.valueNegative}`;
  }
  const displayValue = value !== null && value !== undefined ? value : "--";

  return (
    <div className={styles.indicatorCard}>
      <h4 className={styles.indicatorTitle}>{title}</h4>
      <p className={valueClasses}>{displayValue}</p>
    </div>
  );
}
