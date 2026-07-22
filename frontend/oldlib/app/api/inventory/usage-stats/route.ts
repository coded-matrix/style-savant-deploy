// API Route: Get AI Usage Statistics

import { NextRequest, NextResponse } from "next/server";
import { InventoryAnalyzer } from "@/lib/inventory/inventory-analyzer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const days = Number(searchParams.get("days")) || 30;

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    const analyzer = new InventoryAnalyzer();
    const stats = await analyzer.getUsageStats(vendorId, days);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
