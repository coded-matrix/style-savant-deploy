// API Route: Get Token Transaction History

import { NextRequest, NextResponse } from "next/server";
import { TokenManager } from "@/lib/tokens/token-manager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const limit = Number(searchParams.get("limit")) || 50;

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    const transactions = await TokenManager.getTransactionHistory(
      vendorId,
      limit
    );

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
