"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";
import { TOKEN_BUNDLES, type TokenBundle } from "@/lib/tokens/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface TokenPurchaseProps {
  vendorId: string;
  vendorEmail: string;
  onPurchaseInitiated?: (reference: string) => void;
}

export function TokenPurchasePanel({ vendorId, vendorEmail, onPurchaseInitiated }: TokenPurchaseProps) {
  const [selectedBundle, setSelectedBundle] = useState<TokenBundle>(TOKEN_BUNDLES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/tokens/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          tokenAmount: selectedBundle.tokens,
          amountGHS: selectedBundle.priceGHS,
          email: vendorEmail,
          metadata: {
            bundle: selectedBundle.tokens,
            bonus: selectedBundle.bonus,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Paystack payment page
        window.location.href = data.authorizationUrl;
        onPurchaseInitiated?.(data.reference);
      } else {
        setError(data.error || "Failed to initialize payment");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Purchase Tokens</h2>
        <p className="text-gray-600">
          Choose a token bundle to power your AI features. All prices are in GHS.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {TOKEN_BUNDLES.map((bundle) => (
          <Card
            key={bundle.tokens}
            className={`cursor-pointer transition-all ${
              selectedBundle.tokens === bundle.tokens
                ? "border-primary ring-2 ring-primary/20"
                : "hover:border-primary/70"
            }`}
            onClick={() => setSelectedBundle(bundle)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{formatNumber(bundle.tokens)}</CardTitle>
                {bundle.bonus > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +{bundle.bonus} Bonus
                  </Badge>
                )}
              </div>
              <CardDescription>tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(bundle.priceGHS)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ~{formatCurrency(bundle.priceGHS / bundle.tokens)} per token
                  </p>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {Math.floor(bundle.tokens / 10)} inventory analyses
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {Math.floor(bundle.tokens / 5)} background removals
                    </span>
                  </li>
                  {bundle.bonus > 0 && (
                    <li className="flex items-center gap-2 text-green-600 font-medium">
                      <Zap className="h-4 w-4" />
                      <span>Save {((bundle.bonus / bundle.tokens) * 100).toFixed(0)}%</span>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Selected Bundle:</span>
              <span className="font-medium">{formatNumber(selectedBundle.tokens)} tokens</span>
            </div>
            {selectedBundle.bonus > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Bonus Tokens:</span>
                <span className="font-medium">+{formatNumber(selectedBundle.bonus)} tokens</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold text-lg">{formatCurrency(selectedBundle.priceGHS)}</span>
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full mt-4"
            size="lg"
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </Button>

          <p className="text-xs text-center text-gray-600 mt-3">
            Secure payment powered by Paystack • Act 987 Compliant
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
