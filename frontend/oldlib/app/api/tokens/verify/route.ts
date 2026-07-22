// API Route: Verify Token Purchase

import { NextRequest, NextResponse } from "next/server";
import { PaystackService } from "@/lib/tokens/paystack-service";
import { TokenManager } from "@/lib/tokens/token-manager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const paystackService = new PaystackService();
    const verification = await paystackService.verifyTransaction(reference);

    if (!verification.status || verification.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Extract metadata
    const { vendorId, tokenAmount } = verification.data.metadata;

    if (!vendorId || !tokenAmount) {
      return NextResponse.json(
        { error: "Invalid payment metadata" },
        { status: 400 }
      );
    }

    // Add tokens to vendor account
    await TokenManager.addTokens(
      vendorId,
      Number(tokenAmount),
      reference,
      verification.data.metadata
    );

    // Get updated balance
    const balance = await TokenManager.getBalance(vendorId);

    return NextResponse.json({
      success: true,
      message: "Tokens added successfully",
      balance,
    });
  } catch (error) {
    console.error("Error verifying token purchase:", error);
    return NextResponse.json(
      { error: "Failed to verify purchase" },
      { status: 500 }
    );
  }
}
