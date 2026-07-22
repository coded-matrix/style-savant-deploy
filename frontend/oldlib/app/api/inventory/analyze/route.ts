// API Route: Run Inventory Analysis

import { NextRequest, NextResponse } from "next/server";
import { InventoryAnalyzer } from "@/lib/inventory/inventory-analyzer";
import type { InventoryAnalysisRequest } from "@/lib/inventory/types";

export async function POST(request: NextRequest) {
  try {
    const body: InventoryAnalysisRequest = await request.json();
    const { vendorId, productIds, forecastPeriod, includeSeasonalContext } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    const analyzer = new InventoryAnalyzer();
    const result = await analyzer.runAnalysis({
      vendorId,
      productIds,
      forecastPeriod,
      includeSeasonalContext,
    });

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error("Error running inventory analysis:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Analysis failed";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes("Insufficient tokens") ? 402 : 500 }
    );
  }
}
