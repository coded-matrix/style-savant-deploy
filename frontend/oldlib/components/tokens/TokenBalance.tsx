"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Coins, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { TokenBalance } from "@/lib/tokens/types";

interface TokenBalanceProps {
  vendorId: string;
  onPurchaseClick?: () => void;
}

export function TokenBalanceWidget({ vendorId, onPurchaseClick }: TokenBalanceProps) {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, [vendorId]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tokens/balance?vendorId=${vendorId}`);
      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch token balance");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>{error || "No token balance found"}</p>
            <Button onClick={onPurchaseClick} className="mt-4">
              Purchase Tokens
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercent = (balance.tokensUsed / balance.tokensTotal) * 100;

  return (
    <Card className={balance.lowBalanceAlert ? "border-accent" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Balance
          </span>
          <Badge variant={balance.status === "active" ? "default" : "destructive"}>
            {balance.status}
          </Badge>
        </CardTitle>
        <CardDescription>Your AI feature token balance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-bold">{formatNumber(balance.tokensRemaining)}</span>
              <span className="text-sm text-gray-500">
                of {formatNumber(balance.tokensTotal)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  balance.lowBalanceAlert ? "bg-accent" : "bg-primary"
                }`}
                style={{ width: `${Math.max(0, 100 - usagePercent)}%` }}
              ></div>
            </div>
          </div>

          {balance.lowBalanceAlert && (
            <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-sm font-medium text-accent">Low Balance Alert</p>
                <p className="text-xs text-accent">
                  Your token balance is running low. Purchase more to continue using AI features.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500">Used</p>
              <p className="text-lg font-semibold">{formatNumber(balance.tokensUsed)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Usage Rate</p>
              <p className="text-lg font-semibold">{usagePercent.toFixed(1)}%</p>
            </div>
          </div>

          <Button onClick={onPurchaseClick} className="w-full" variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Purchase More Tokens
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
