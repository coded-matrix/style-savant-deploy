// API Route: Remove Background from Product Image

import { NextRequest, NextResponse } from "next/server";
import { InventoryAnalyzer } from "@/lib/inventory/inventory-analyzer";
import type { BackgroundRemovalRequest } from "@/lib/inventory/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, imageBase64, imageUrl, outputFormat = "base64" } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: "Image data is required (imageBase64 or imageUrl)" },
        { status: 400 }
      );
    }

    const analyzer = new InventoryAnalyzer();
    const result = await analyzer.removeBackground(vendorId, {
      imageBase64,
      imageUrl,
      outputFormat,
    } as BackgroundRemovalRequest);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error removing background:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Background removal failed";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes("Insufficient tokens") ? 402 : 500 }
    );
  }
}
