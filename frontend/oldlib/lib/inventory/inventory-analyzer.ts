// Inventory Analysis Manager - Orchestrates AI inventory features

import { db } from "@/lib/db";
import { inventoryAnalyses, aiUsageLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { dbTimestamp, toJsonField } from "@/lib/db/utils";
import { TokenManager } from "@/lib/tokens/token-manager";
import { DemandForecaster } from "./demand-forecaster";
import { GeminiService } from "./gemini-service";
import { TOKEN_COSTS } from "@/lib/tokens/types";
import type {
  InventoryAnalysisRequest,
  InventoryAnalysisResult,
  BackgroundRemovalRequest,
  BackgroundRemovalResult,
} from "./types";

export class InventoryAnalyzer {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Run complete inventory analysis
   */
  async runAnalysis(
    request: InventoryAnalysisRequest
  ): Promise<InventoryAnalysisResult> {
    const { vendorId, forecastPeriod = "month", includeSeasonalContext = true } = request;

    // Check token balance
    const tokensCost = TOKEN_COSTS.INVENTORY_ANALYSIS;
    const hasTokens = await TokenManager.hasEnoughTokens(vendorId, tokensCost);
    if (!hasTokens) {
      throw new Error("Insufficient tokens for inventory analysis");
    }

    try {
      // Generate forecasts
      const forecasts = await DemandForecaster.forecastDemand(
        request.productIds?.[0] || "", // For now, single product
        vendorId,
        forecastPeriod
      );

      // Generate alerts
      const restockAlerts = await DemandForecaster.generateRestockAlerts(vendorId);
      const overstockAlerts = await DemandForecaster.generateOverstockAlerts(vendorId);

      // Calculate optimization score (0-100)
      const totalAlerts = restockAlerts.length + overstockAlerts.length;
      const criticalAlerts = restockAlerts.filter((a) => a.urgency === "critical").length;
      const optimizationScore = Math.max(0, 100 - totalAlerts * 10 - criticalAlerts * 20);

      // Calculate potential savings
      const potentialSavings = overstockAlerts.reduce(
        (sum, alert) => sum + alert.tieUpValue * 0.1,
        0
      );

      // Use tokens
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await TokenManager.useTokens({
        vendorId,
        featureType: "inventory_analysis",
        tokensCost,
        description: "Inventory analysis run",
        metadata: {
          forecastPeriod,
          productCount: request.productIds?.length || "all",
        },
      });

      // Store analysis -- generate UUIDs on the application side so SQLite
      // does not need to rely on Postgres-only functions like gen_random_uuid()
      const [analysis] = await db
        .insert(inventoryAnalyses)
        .values({
          id: randomUUID(),
          vendorId,
          analysisType: "demand_forecast",
          currentStock: forecasts?.currentStock || 0,
          forecastedDemand: forecasts?.forecastedDemand || 0,
          confidence: forecasts?.confidence.toString() || "0",
          recommendations: JSON.stringify({ restockAlerts, overstockAlerts }),
          createdAt: dbTimestamp(),
        })
        .returning();

      // Log AI usage (application-generated id avoids SQLite gen_random_uuid())
      await db.insert(aiUsageLogs).values({
        id: randomUUID(),
        vendorId,
        featureType: "inventory_analysis",
        tokensCost,
        inputData: toJsonField({ request }),
        outputData: toJsonField({
          forecastCount: forecasts ? 1 : 0,
          restockAlertCount: restockAlerts.length,
          overstockAlertCount: overstockAlerts.length,
        }),
        success: true,
        createdAt: dbTimestamp(),
      });

      return {
        analysisId: analysis.id,
        vendorId,
        timestamp: new Date(),
        demandForecasts: forecasts ? [forecasts] : [],
        restockAlerts,
        overstockAlerts,
        summary: {
          totalProducts: 1, // Simplified
          criticalAlerts,
          optimizationScore,
          potentialSavings,
        },
        tokensCost,
      };
    } catch (error) {
      // Log failed usage
      await db.insert(aiUsageLogs).values({
        id: randomUUID(),
        vendorId,
        featureType: "inventory_analysis",
        tokensCost: 0,
        inputData: toJsonField({ request }),
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        createdAt: dbTimestamp(),
      });

      throw error;
    }
  }

  /**
   * Remove background from product image
   */
  async removeBackground(
    vendorId: string,
    request: BackgroundRemovalRequest
  ): Promise<BackgroundRemovalResult> {
    const tokensCost = TOKEN_COSTS.BACKGROUND_REMOVAL;

    // Check token balance
    const hasTokens = await TokenManager.hasEnoughTokens(vendorId, tokensCost);
    if (!hasTokens) {
      throw new Error("Insufficient tokens for background removal");
    }

    try {
      // Accept either base64 data or an imageUrl; pass through to GeminiService which
      // will fetch/convert remote images as needed.
      const imageInput = request.imageBase64 || request.imageUrl || "";

      // Keep a copy of the input string for logging/sizing. Note: when a URL
      // is provided, this will be the URL string length; GeminiService handles
      // fetching/conversion. We avoid any DB-side UUID defaults by generating
      // ids here.
      const imageData = imageInput;

      // Process with Gemini (geminiService handles URLs and base64)
      const result = await this.geminiService.removeBackground(imageInput);

      if (!result.success) {
        throw new Error(result.error || "Background removal failed");
      }

      // Use tokens
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await TokenManager.useTokens({
        vendorId,
        featureType: "background_removal",
        tokensCost,
        description: "Background removal",
      });

      // Log usage (generate id in app to avoid SQLite gen_random_uuid)
      await db.insert(aiUsageLogs).values({
        id: randomUUID(),
        vendorId,
        featureType: "background_removal",
        tokensCost,
        inputData: toJsonField({ imageSize: imageData.length }),
        outputData: toJsonField({ success: result.success }),
        success: true,
        createdAt: dbTimestamp(),
      });

      return {
        success: true,
        processedImageBase64: result.processedImage,
        originalSize: imageData.length,
        processedSize: result.processedImage?.length || 0,
        tokensCost,
      };
    } catch (error) {
      // Log failed usage (include generated id so SQLite won't call gen_random_uuid)
      await db.insert(aiUsageLogs).values({
        id: randomUUID(),
        vendorId,
        featureType: "background_removal",
        tokensCost: 0,
        inputData: toJsonField(request),
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        createdAt: dbTimestamp(),
      });

      throw error;
    }
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStats(vendorId: string, days: number = 30) {
    const stats = await db
      .select()
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.vendorId, vendorId));

    const totalTokensUsed = stats.reduce((sum, log) => sum + log.tokensCost, 0);
    const successfulCalls = stats.filter((log) => log.success).length;
    const failedCalls = stats.filter((log) => !log.success).length;

    const featureBreakdown = stats.reduce(
      (acc, log) => {
        acc[log.featureType] = (acc[log.featureType] || 0) + log.tokensCost;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalTokensUsed,
      successfulCalls,
      failedCalls,
      featureBreakdown,
      periodDays: days,
    };
  }
}
