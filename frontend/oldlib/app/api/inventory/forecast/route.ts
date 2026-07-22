// API Route: Get Demand Forecast

import { NextRequest, NextResponse } from "next/server";
import { DemandForecaster } from "@/lib/inventory/demand-forecaster";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const productId = searchParams.get("productId");
    const period = searchParams.get("period") as "week" | "month" | "quarter" || "month";

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const forecast = await DemandForecaster.forecastDemand(
      productId,
      vendorId,
      period
    );

    if (!forecast) {
      return NextResponse.json(
        { error: "No sales data available for forecast" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      forecast,
    });
  } catch (error) {
    console.error("Error generating forecast:", error);
    return NextResponse.json(
      { error: "Failed to generate forecast" },
      { status: 500 }
    );
  }
}
