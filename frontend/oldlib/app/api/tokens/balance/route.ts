// API Route: Get Token Balance

import { NextRequest, NextResponse } from "next/server";
import { TokenManager } from "@/lib/tokens/token-manager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    const balance = await TokenManager.getBalance(vendorId);

    if (!balance) {
      return NextResponse.json(
        { error: "No subscription found for vendor" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, balance });
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch token balance" },
      { status: 500 }
    );
  }
}
