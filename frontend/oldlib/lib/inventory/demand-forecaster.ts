// Demand Forecasting Logic

import { db } from "@/lib/db";
import { salesHistory, products } from "@/lib/db/schema";
import { eq, gte, and } from "drizzle-orm";
import {
  DemandForecast,
  RestockAlert,
  OverstockAlert,
  SEASONAL_CONTEXTS,
  STOCK_THRESHOLDS,
  type SalesData,
} from "./types";
import { subMonths, addDays } from "date-fns";

export class DemandForecaster {
  /**
   * Calculate moving average for demand forecasting
   */
  private static calculateMovingAverage(
    data: number[],
    window: number = 3
  ): number {
    if (data.length === 0) return 0;
    if (data.length < window) window = data.length;

    const recentData = data.slice(-window);
    const sum = recentData.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / window);
  }

  /**
   * Calculate trend (increasing, stable, decreasing)
   */
  private static calculateTrend(
    data: number[]
  ): "increasing" | "stable" | "decreasing" {
    if (data.length < 2) return "stable";

    const mid = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, mid);
    const secondHalf = data.slice(mid);

    const firstAvg =
      firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0;
    const secondAvg =
      secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0;

    const changePercent = ((secondAvg - firstAvg) / (firstAvg || 1)) * 100;

    if (changePercent > 15) return "increasing";
    if (changePercent < -15) return "decreasing";
    return "stable";
  }

  /**
   * Get seasonal multiplier for current period
   */
  private static getSeasonalMultiplier(): number {
    const currentMonth = new Date().getMonth() + 1;

    for (const context of Object.values(SEASONAL_CONTEXTS)) {
      if (context.months.includes(currentMonth)) {
        return context.multiplier;
      }
    }

    return 1.0; // No seasonal effect
  }

  /**
   * Forecast demand for a product
   */
  static async forecastDemand(
    productId: string,
    vendorId: string,
    forecastPeriod: "week" | "month" | "quarter" = "month"
  ): Promise<DemandForecast | null> {
    // Get sales history (last 6 months)
    const sixMonthsAgo = subMonths(new Date(), 6);

    const salesData = await db
      .select()
      .from(salesHistory)
      .where(
        and(
          eq(salesHistory.productId, productId),
          eq(salesHistory.vendorId, vendorId),
          gte(salesHistory.saleDate, sixMonthsAgo)
        )
      );

    if (salesData.length === 0) return null;

    // Get product info
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) return null;

    // Calculate monthly sales
    const monthlySales = salesData.map((s) => s.quantitySold);
    const avgMonthlySales = this.calculateMovingAverage(monthlySales, 3);

    // Apply seasonal adjustment
    const seasonalMultiplier = this.getSeasonalMultiplier();
    const adjustedForecast = Math.round(avgMonthlySales * seasonalMultiplier);

    // Adjust for forecast period
    let forecastedDemand = adjustedForecast;
    if (forecastPeriod === "week") {
      forecastedDemand = Math.round(adjustedForecast / 4);
    } else if (forecastPeriod === "quarter") {
      forecastedDemand = Math.round(adjustedForecast * 3);
    }

    // Calculate confidence based on data consistency
    const variance =
      monthlySales.length > 1
        ? Math.sqrt(
            monthlySales.reduce(
              (sum, val) => sum + Math.pow(val - avgMonthlySales, 2),
              0
            ) / monthlySales.length
          )
        : 0;
    const coefficientOfVariation = variance / (avgMonthlySales || 1);
    const confidence = Math.max(0, Math.min(100, 100 - coefficientOfVariation * 50));

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      forecastedDemand,
      forecastPeriod,
      confidence: Math.round(confidence),
      trend: this.calculateTrend(monthlySales),
    };
  }

  /**
   * Generate restock alerts
   */
  static async generateRestockAlerts(
    vendorId: string
  ): Promise<RestockAlert[]> {
    const alerts: RestockAlert[] = [];

    // Get all products for vendor
    const vendorProducts = await db
      .select()
      .from(products)
      .where(eq(products.vendorId, vendorId));

    for (const product of vendorProducts) {
      // Get forecast
      const forecast = await this.forecastDemand(product.id, vendorId, "month");
      if (!forecast) continue;

      // Calculate minimum threshold (15% of monthly demand)
      const minThreshold = Math.ceil(
        forecast.forecastedDemand * STOCK_THRESHOLDS.MINIMUM_STOCK_PERCENTAGE
      );

      // Check if stock is below threshold
      if (product.stock <= minThreshold) {
        // Estimate stockout date
        const dailyDemand = forecast.forecastedDemand / 30;
        const daysUntilStockout = product.stock / (dailyDemand || 1);
        const estimatedStockoutDate = addDays(new Date(), daysUntilStockout);

        // Determine urgency
        let urgency: RestockAlert["urgency"];
        if (daysUntilStockout <= 3) urgency = "critical";
        else if (daysUntilStockout <= 7) urgency = "high";
        else if (daysUntilStockout <= 14) urgency = "medium";
        else urgency = "low";

        // Calculate suggested restock quantity
        const suggestedRestockQty = Math.ceil(
          forecast.forecastedDemand * 1.5 - product.stock
        );

        alerts.push({
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          minimumThreshold: minThreshold,
          suggestedRestockQty,
          urgency,
          estimatedStockoutDate,
          reason: `Current stock (${product.stock}) is below minimum threshold (${minThreshold}). Estimated stockout in ${Math.round(daysUntilStockout)} days.`,
        });
      }
    }

    // Sort by urgency
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return alerts;
  }

  /**
   * Generate overstock alerts
   */
  static async generateOverstockAlerts(
    vendorId: string
  ): Promise<OverstockAlert[]> {
    const alerts: OverstockAlert[] = [];

    const vendorProducts = await db
      .select()
      .from(products)
      .where(eq(products.vendorId, vendorId));

    for (const product of vendorProducts) {
      const forecast = await this.forecastDemand(product.id, vendorId, "month");
      if (!forecast) continue;

      // Optimal stock is ~2 months of forecasted demand
      const optimalStock = forecast.forecastedDemand * 2;

      // Check if stock is 3x or more than optimal
      if (product.stock >= optimalStock * STOCK_THRESHOLDS.OVERSTOCK_MULTIPLIER) {
        const excessQuantity = product.stock - optimalStock;
        const tieUpValue = Number(product.price) * excessQuantity;

        const recommendations: string[] = [
          "Consider running a promotion to move excess inventory",
          `Reduce next order quantity by ${excessQuantity} units`,
        ];

        if (tieUpValue > 500) {
          recommendations.push(
            `High capital tie-up: GHS ${tieUpValue.toFixed(2)}`
          );
        }

        alerts.push({
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          optimalStock: Math.round(optimalStock),
          excessQuantity,
          tieUpValue,
          recommendations,
        });
      }
    }

    return alerts;
  }
}
