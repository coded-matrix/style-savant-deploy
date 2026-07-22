"use client";

import { useEffect, useState } from "react";
import { adminApi, type AdminDashboard } from "@/lib/api/admin";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  Coins,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString();
}

function ghs(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await adminApi.getDashboard();
      setData(d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-mid-grey" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-v-body text-mid-grey py-10 text-center">Failed to load dashboard.</p>;
  }

  return (
    <div>
      <h1 className="text-v-title font-bold text-ink dark:text-white mb-1">Dashboard</h1>
      <p className="text-v-meta text-mid-grey mb-8">Platform overview and key metrics</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Total Users" value={fmt(data.totalUsers)} />
        <Stat icon={Store} label="Vendors" value={fmt(data.totalVendors)} />
        <Stat icon={Package} label="Products" value={fmt(data.totalProducts)} />
        <Stat icon={ShoppingCart} label="Orders" value={fmt(data.totalOrders)} />
        <Stat icon={ShoppingCart} label="Orders (30d)" value={fmt(data.recentOrders)} />
        <Stat icon={TrendingUp} label="Total Revenue" value={ghs(data.totalRevenue)} />
        <Stat icon={TrendingUp} label="Revenue (30d)" value={ghs(data.monthlyRevenue)} />
        <Stat icon={Coins} label="Active Subscriptions" value={fmt(data.activeSubscriptions)} />
      </div>

      <h2 className="text-v-title font-bold text-ink dark:text-white mt-10 mb-4">Token Economy</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat icon={Coins} label="Tokens Purchased" value={fmt(data.tokens.totalTokensPurchased)} />
        <Stat icon={Coins} label="Tokens Used" value={fmt(data.tokens.totalTokensUsed)} />
        <Stat icon={Coins} label="Tokens Refunded" value={fmt(data.tokens.totalTokensRefunded)} />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-mid-grey dark:text-white/50" />
        <span className="text-v-meta text-mid-grey dark:text-white/50">{label}</span>
      </div>
      <p className="text-v-title font-bold text-ink dark:text-white break-words">{value}</p>
    </div>
  );
}
