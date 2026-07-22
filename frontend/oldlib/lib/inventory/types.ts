// AI Inventory Optimization Types

export interface ProductInventory {
  id: string;
  name: string;
  currentStock: number;
  category: string;
  price: number;
  lastRestockDate?: Date;
}

export interface SalesData {
  productId: string;
  date: Date;
  quantitySold: number;
  revenue: number;
}

export interface DemandForecast {
  productId: string;
  productName: string;
  currentStock: number;
  forecastedDemand: number;
  forecastPeriod: "week" | "month" | "quarter";
  confidence: number;
  trend: "increasing" | "stable" | "decreasing";
  seasonalFactors?: SeasonalFactor[];
}

export interface SeasonalFactor {
  season: string;
  impact: "high" | "medium" | "low";
  multiplier: number;
}

export interface RestockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minimumThreshold: number;
  suggestedRestockQty: number;
  urgency: "critical" | "high" | "medium" | "low";
  estimatedStockoutDate?: Date;
  reason: string;
}

export interface OverstockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  optimalStock: number;
  excessQuantity: number;
  tieUpValue: number;
  recommendations: string[];
}

export interface InventoryAnalysisRequest {
  vendorId: string;
  productIds?: string[];
  includeSeasonalContext?: boolean;
  forecastPeriod?: "week" | "month" | "quarter";
}

export interface InventoryAnalysisResult {
  analysisId: string;
  vendorId: string;
  timestamp: Date;
  demandForecasts: DemandForecast[];
  restockAlerts: RestockAlert[];
  overstockAlerts: OverstockAlert[];
  summary: {
    totalProducts: number;
    criticalAlerts: number;
    optimizationScore: number;
    potentialSavings: number;
  };
  tokensCost: number;
}

export interface BackgroundRemovalRequest {
  imageUrl?: string;
  imageBase64?: string;
  outputFormat?: "url" | "base64";
}

export interface BackgroundRemovalResult {
  success: boolean;
  processedImageUrl?: string;
  processedImageBase64?: string;
  originalSize: number;
  processedSize: number;
  tokensCost: number;
}

export const SEASONAL_CONTEXTS: Record<
  string,
  { name: string; months: number[]; multiplier: number }
> = {
  CHRISTMAS: { name: "Christmas", months: [11, 12], multiplier: 1.8 },
  EASTER: { name: "Easter", months: [3, 4], multiplier: 1.3 },
  BACK_TO_SCHOOL: { name: "Back to School", months: [8, 9], multiplier: 1.5 },
  VALENTINE: { name: "Valentine's Day", months: [2], multiplier: 1.4 },
  INDEPENDENCE: { name: "Independence Day", months: [3], multiplier: 1.2 },
  NEW_YEAR: { name: "New Year", months: [1], multiplier: 1.3 },
};

export const STOCK_THRESHOLDS = {
  MINIMUM_STOCK_PERCENTAGE: 0.15, // Alert when stock drops below 15% of average sales
  OVERSTOCK_MULTIPLIER: 3, // Alert when stock is 3x average sales
  RESTOCK_LEAD_TIME_DAYS: 7, // Assume 7 days to restock
} as const;
