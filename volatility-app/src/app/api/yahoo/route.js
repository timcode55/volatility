// app/api/yahoo/route.js
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET() {
  const symbols = ["^VIX", "^VXV", "SPY"];

  try {
    // Fetch data using Yahoo Finance unofficial API
    const quotes = await yahooFinance.quote(symbols);
    console.log("Fetched quotes:", quotes); // Log the fetched data

    const result = {};
    symbols.forEach((symbol, index) => {
      result[symbol] = quotes[index];
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Yahoo Finance data:", error);
    return NextResponse.json(
      { error: `Failed to fetch data: ${error.message}` },
      { status: 500 }
    );
  }
}
