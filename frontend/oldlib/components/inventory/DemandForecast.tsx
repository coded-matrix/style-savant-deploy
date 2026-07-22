"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { DemandForecast } from "@/lib/inventory/types";

interface DemandForecastProps {
  vendorId: string;
  productId: string;
  productName: string;
}

export function DemandForecastWidget({ vendorId, productId, productName }: DemandForecastProps) {
  const [forecast, setForecast] = useState<DemandForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/inventory/forecast?vendorId=${vendorId}&productId=${productId}&period=${period}`
      );
      const data = await response.json();

      if (data.success) {
        setForecast(data.forecast);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch forecast");
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "decreasing":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "bg-green-100 text-green-800";
      case "decreasing":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Demand Forecast
        </CardTitle>
        <CardDescription>{productName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Period Selector */}
          <div className="flex gap-2">
            {(["week", "month", "quarter"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>

          {/* Generate Forecast Button */}
          {!forecast && (
            <Button onClick={fetchForecast} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate Forecast"}
            </Button>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Forecast Results */}
          {forecast && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-card rounded-lg">
                  <p className="text-sm text-primary mb-1">Current Stock</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(forecast.currentStock)}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">
                    Forecasted Demand ({period})
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatNumber(forecast.forecastedDemand)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getTrendIcon(forecast.trend)}
                  <span className="font-medium">Trend</span>
                </div>
                <Badge className={getTrendColor(forecast.trend)}>
                  {forecast.trend.toUpperCase()}
                </Badge>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Forecast Confidence</span>
                  <span className="font-bold">{forecast.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      forecast.confidence >= 70
                        ? "bg-green-500"
                        : forecast.confidence >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${forecast.confidence}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {forecast.confidence >= 70
                    ? "High confidence - reliable forecast"
                    : forecast.confidence >= 50
                    ? "Moderate confidence - use with caution"
                    : "Low confidence - more data needed"}
                </p>
              </div>

              <Button onClick={fetchForecast} variant="outline" className="w-full">
                Refresh Forecast
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
