"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, TrendingUp, Package } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";
import type { RestockAlert, OverstockAlert } from "@/lib/inventory/types";

interface InventoryAlertsProps {
  vendorId: string;
}

export function InventoryAlertsPanel({ vendorId }: InventoryAlertsProps) {
  const [restockAlerts, setRestockAlerts] = useState<RestockAlert[]>([]);
  const [overstockAlerts, setOverstockAlerts] = useState<OverstockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, [vendorId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/alerts?vendorId=${vendorId}`);
      const data = await response.json();

      if (data.success) {
        setRestockAlerts(data.alerts.restock);
        setOverstockAlerts(data.alerts.overstock);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const urgencyColors = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <div className="space-y-6">
      {/* Restock Alerts */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-600" />
          Restock Alerts ({restockAlerts.length})
        </h3>

        {restockAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <Package className="mx-auto h-8 w-8 mb-2" />
              <p>No restock alerts. All products are well-stocked!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {restockAlerts.map((alert) => (
              <Card key={alert.productId} className={urgencyColors[alert.urgency]}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{alert.productName}</h4>
                      <p className="text-sm opacity-80">{alert.reason}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {alert.urgency.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                    <div>
                      <p className="opacity-70">Current Stock</p>
                      <p className="font-bold">{formatNumber(alert.currentStock)}</p>
                    </div>
                    <div>
                      <p className="opacity-70">Min. Threshold</p>
                      <p className="font-bold">{formatNumber(alert.minimumThreshold)}</p>
                    </div>
                    <div>
                      <p className="opacity-70">Suggested Order</p>
                      <p className="font-bold text-green-600">
                        {formatNumber(alert.suggestedRestockQty)}
                      </p>
                    </div>
                  </div>

                  {alert.estimatedStockoutDate && (
                    <div className="mt-3 pt-3 border-t border-opacity-20">
                      <p className="text-xs">
                        <AlertTriangle className="inline h-3 w-3 mr-1" />
                        Estimated stockout: {formatDate(alert.estimatedStockoutDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Overstock Alerts */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-600" />
          Overstock Alerts ({overstockAlerts.length})
        </h3>

        {overstockAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <Package className="mx-auto h-8 w-8 mb-2" />
              <p>No overstock issues. Inventory levels are optimal!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {overstockAlerts.map((alert) => (
              <Card key={alert.productId} className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-amber-900">{alert.productName}</h4>
                      <p className="text-sm text-amber-700">
                        Excess stock detected - capital tie-up risk
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3 text-sm text-amber-900">
                    <div>
                      <p className="opacity-70">Current Stock</p>
                      <p className="font-bold">{formatNumber(alert.currentStock)}</p>
                    </div>
                    <div>
                      <p className="opacity-70">Optimal Stock</p>
                      <p className="font-bold">{formatNumber(alert.optimalStock)}</p>
                    </div>
                    <div>
                      <p className="opacity-70">Excess Qty</p>
                      <p className="font-bold text-red-600">
                        {formatNumber(alert.excessQuantity)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-amber-300">
                    <p className="text-sm font-semibold text-amber-900 mb-2">
                      Tied-up Capital: GHS {alert.tieUpValue.toFixed(2)}
                    </p>
                    <ul className="text-xs space-y-1 text-amber-800">
                      {alert.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
