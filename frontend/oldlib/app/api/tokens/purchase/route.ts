// API Route: Initialize Token Purchase

import { NextRequest, NextResponse } from "next/server";
import { PaystackService } from "@/lib/tokens/paystack-service";
import type { TokenPurchaseRequest } from "@/lib/tokens/types";

export async function POST(request: NextRequest) {
  try {
    const body: TokenPurchaseRequest = await request.json();
    const { vendorId, tokenAmount, amountGHS, email, metadata } = body;

    if (!vendorId || !tokenAmount || !amountGHS || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const paystackService = new PaystackService();

    const result = await paystackService.initializeTransaction(
      email,
      amountGHS,
      {
        vendorId,
        tokenAmount,
        purpose: "token_purchase",
        ...metadata,
      }
    );

    if (!result.status) {
      return NextResponse.json(
        { error: result.message || "Payment initialization failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reference: result.data.reference,
      authorizationUrl: result.data.authorization_url,
      accessCode: result.data.access_code,
    });
  } catch (error) {
    console.error("Error initializing token purchase:", error);
    return NextResponse.json(
      { error: "Failed to initialize purchase" },
      { status: 500 }
    );
  }
}
