// File: app/api/yahoo/route.js
// (Keep previous imports and helper functions: formatNumber, getQuoteData)
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

// --- Configuration ---
const VIX_SYMBOL = "^VIX";
const MARKET_SYMBOL = "^GSPC"; // S&P 500 for market context
const VIX_BUY_THRESHOLD = 30;
// --- End Configuration ---

// Helper function to format numbers nicely
function formatNumber(num, digits = 2) {
  if (typeof num !== "number") return "N/A";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// Helper to extract relevant quote data safely
function getQuoteData(quote) {
  if (!quote) return null;
  return {
    symbol: quote.symbol,
    name: quote.shortName || "N/A",
    marketState: quote.marketState || "N/A",
    currentPrice: quote.regularMarketPrice,
    previousClose: quote.regularMarketPreviousClose,
    openPrice: quote.regularMarketOpen,
    dayHigh: quote.regularMarketDayHigh,
    dayLow: quote.regularMarketDayLow,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    volume: quote.regularMarketVolume,
  };
}

export async function GET(request) {
  const symbols = [VIX_SYMBOL, MARKET_SYMBOL];
  console.log(`[API Route] Initiating fetch for: ${symbols.join(", ")}`); // Log start

  try {
    const quotes = await yahooFinance.quote(symbols);
    console.log(`[API Route] Raw data received from yahoo-finance2.`); // Log data received

    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
    const vixDataRaw = quotesArray.find((q) => q?.symbol === VIX_SYMBOL);
    const marketDataRaw = quotesArray.find((q) => q?.symbol === MARKET_SYMBOL);

    console.log(
      `[API Route] VIX Data found: ${!!vixDataRaw}, Market Data found: ${!!marketDataRaw}`
    ); // Log found status

    const vixData = getQuoteData(vixDataRaw);
    const marketData = getQuoteData(marketDataRaw);

    if (
      !vixData ||
      vixData.currentPrice === undefined ||
      vixData.currentPrice === null
    ) {
      // Added null check
      console.error(
        `[API Route Error] Failed to get valid VIX data. Raw:`,
        vixDataRaw
      );
      return NextResponse.json(
        { error: `Failed to retrieve valid data for VIX (${VIX_SYMBOL})` },
        { status: 500 }
      );
    }
    if (!marketData) {
      console.warn(
        `[API Route Warn] Failed to get market context data (${MARKET_SYMBOL}). Proceeding with VIX only.`
      );
    }

    const currentVix = vixData.currentPrice;
    const isHighFear = currentVix > VIX_BUY_THRESHOLD;
    const isVixLowerThanOpen = vixData.openPrice
      ? currentVix < vixData.openPrice
      : false;
    const isBuySignal = isHighFear;

    let signalReason = `VIX (${formatNumber(currentVix)}) `;
    if (isHighFear) {
      signalReason += `is above the high fear threshold (${VIX_BUY_THRESHOLD}). Extreme fear can indicate potential market bottoms.`;
      if (isVixLowerThanOpen) {
        signalReason += ` VIX is also lower than its open (${formatNumber(
          vixData.openPrice
        )}), suggesting fear *might* be easing slightly today.`;
      }
    } else {
      signalReason += `is below the high fear threshold (${VIX_BUY_THRESHOLD}). Market fear is not considered extreme based on this level.`;
    }

    const responseData = {
      timestamp: new Date().toISOString(),
      vix: {
        ...vixData,
        currentPriceFormatted: formatNumber(vixData.currentPrice),
        previousCloseFormatted: formatNumber(vixData.previousClose),
        openPriceFormatted: formatNumber(vixData.openPrice),
        dayHighFormatted: formatNumber(vixData.dayHigh),
        dayLowFormatted: formatNumber(vixData.dayLow),
        changeFormatted: formatNumber(vixData.change),
        changePercentFormatted: formatNumber(vixData.changePercent, 2),
      },
      market: marketData
        ? {
            ...marketData,
            currentPriceFormatted: formatNumber(marketData.currentPrice),
            previousCloseFormatted: formatNumber(marketData.previousClose),
            openPriceFormatted: formatNumber(marketData.openPrice),
            dayHighFormatted: formatNumber(marketData.dayHigh),
            dayLowFormatted: formatNumber(marketData.dayLow),
            changeFormatted: formatNumber(marketData.change),
            changePercentFormatted: formatNumber(marketData.changePercent, 2),
            volumeFormatted: marketData.volume?.toLocaleString() || "N/A",
          }
        : null,
      signal: {
        isBuySignal: isBuySignal,
        threshold: VIX_BUY_THRESHOLD,
        reason: signalReason,
      },
    };

    console.log(
      `[API Route] Successfully processed data. Returning JSON response.`
    ); // <-- ADDED LOG
    return NextResponse.json(responseData);
  } catch (error) {
    // Log the *entire* error object for more details
    console.error(
      "[API Route Error] Error fetching or processing Yahoo Finance data:",
      error
    );
    let errorMessage = "Failed to fetch data from Yahoo Finance API.";
    let status = 500;
    if (error.message?.includes("Not Found")) {
      errorMessage = `One or more symbols (${symbols.join(
        ", "
      )}) not found or API endpoint changed.`;
      status = 404;
    } else if (
      error.name === "FailedYahooValidationError" ||
      error.message?.includes("Failed validate")
    ) {
      // Catch validation errors
      errorMessage = `Data validation failed for symbols (${symbols.join(
        ", "
      )}). Yahoo structure might have changed. Check server logs.`;
      status = 500;
    } else if (error.name === "AbortError") {
      errorMessage = "Request to Yahoo Finance timed out.";
      status = 504; // Gateway timeout
    }

    return NextResponse.json(
      // Send the original error message in details for debugging
      {
        error: errorMessage,
        details: error.message || "No specific error message available.",
      },
      { status: status }
    );
  }
}
