// API Route: Get Inventory Alerts (Restock & Overstock)

import { NextRequest, NextResponse } from "next/server";
import { DemandForecaster } from "@/lib/inventory/demand-forecaster";
import type { OverstockAlert, RestockAlert } from "@/lib/inventory/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const type = searchParams.get("type"); // 'restock' | 'overstock' | 'all'

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    let restockAlerts: RestockAlert[] = [];
    let overstockAlerts: OverstockAlert[] = [];

    if (type === "restock" || type === "all" || !type) {
      restockAlerts = await DemandForecaster.generateRestockAlerts(vendorId);
    }

    if (type === "overstock" || type === "all" || !type) {
      overstockAlerts = await DemandForecaster.generateOverstockAlerts(vendorId);
    }

    return NextResponse.json({
      success: true,
      alerts: {
        restock: restockAlerts,
        overstock: overstockAlerts,
      },
      summary: {
        totalAlerts: restockAlerts.length + overstockAlerts.length,
        criticalRestock: restockAlerts.filter((a) => a.urgency === "critical").length,
        highOverstock: overstockAlerts.filter((a) => a.excessQuantity > 100).length,
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
