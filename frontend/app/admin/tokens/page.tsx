"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { Search, Coins, ArrowUpRight, ArrowDownLeft, RefreshCw, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vendor {
  id: string;
  businessName: string;
  category: string | null;
  verified: boolean;
  productsCount: number;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  tokenBalance: number;
}

interface TxRow {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string | null;
  reference: string | null;
  createdAt: string;
}

export default function AdminTokensPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Token action modal
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [action, setAction] = useState<"reset" | "credit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // History modal
  const [historyVendor, setHistoryVendor] = useState<Vendor | null>(null);
  const [history, setHistory] = useState<TxRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await adminApi.listVendors({ search, page: p, limit: 15 });
      setVendors(res.vendors);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    setPage(1);
  }, [search]);

  const openHistory = async (v: Vendor) => {
    setHistoryVendor(v);
    setHistoryLoading(true);
    try {
      const h = await adminApi.getTokenHistory(v.id, 30);
      setHistory(h);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitAction = async () => {
    if (!selectedVendor || !amount || !reason) return;
    setSubmitting(true);
    try {
      const amt = parseInt(amount);
      if (action === "credit") {
        await adminApi.creditTokens(selectedVendor.id, amt, reason);
      } else {
        await adminApi.resetTokens(selectedVendor.id, amt, reason);
      }
      setSelectedVendor(null);
      setAmount("");
      setReason("");
      load();
    } catch (err: any) {
      alert(err?.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <h1 className="text-v-title font-bold text-ink dark:text-white mb-1">Token Management</h1>
      <p className="text-v-meta text-mid-grey mb-6">View and manage vendor token balances</p>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mid-grey" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors..."
          className="w-full rounded-lg border border-line dark:border-white/15 bg-white dark:bg-surface-dark pl-9 pr-4 py-2.5 text-v-body text-ink dark:text-white placeholder:text-mid-grey outline-none focus:border-teal"
        />
      </div>

      {/* Vendor list */}
      <div className="rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line dark:border-white/10 bg-surface-low dark:bg-white/[0.03]">
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Vendor</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Owner</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Balance</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-v-body text-mid-grey">Loading...</td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-v-body text-mid-grey">No vendors found.</td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="border-b border-line dark:border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-v-body font-medium text-ink dark:text-white">{v.businessName}</p>
                      <p className="text-v-meta text-mid-grey">{v.category || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-v-body text-ink dark:text-white">{v.userName}</p>
                      <p className="text-v-meta text-mid-grey">{v.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-v-body font-bold",
                        v.tokenBalance > 100 ? "text-teal dark:text-off-white" :
                        v.tokenBalance > 0 ? "text-warn" : "text-error",
                      )}>
                        {v.tokenBalance.toLocaleString()} tk
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedVendor(v); setAction("credit"); setAmount(""); setReason(""); }}
                          className="rounded-lg bg-teal/10 px-2.5 py-1.5 text-v-meta font-bold text-teal dark:text-off-white hover:bg-teal/20 transition-colors"
                          title="Credit tokens"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedVendor(v); setAction("reset"); setAmount(""); setReason(""); }}
                          className="rounded-lg bg-error/10 px-2.5 py-1.5 text-v-meta font-bold text-error hover:bg-error/20 transition-colors"
                          title="Reset tokens"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openHistory(v)}
                          className="rounded-lg bg-surface-low dark:bg-white/5 px-2.5 py-1.5 text-v-meta font-bold text-mid-grey hover:bg-surface-low dark:hover:bg-white/10 transition-colors"
                          title="View history"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-v-meta text-mid-grey">
            Page {page} of {totalPages} ({total} vendors)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => { setPage(page - 1); load(page - 1); }}
              className="rounded-lg border border-line dark:border-white/15 px-3 py-1.5 text-v-meta text-mid-grey disabled:opacity-40 hover:bg-surface-low dark:hover:bg-white/5"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => { setPage(page + 1); load(page + 1); }}
              className="rounded-lg border border-line dark:border-white/15 px-3 py-1.5 text-v-meta text-mid-grey disabled:opacity-40 hover:bg-surface-low dark:hover:bg-white/5"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Credit / Reset modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedVendor(null)}>
          <div
            className="w-full max-w-sm rounded-xl border border-line dark:border-white/15 bg-white dark:bg-surface-dark overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line dark:border-white/10">
              <h3 className="text-v-title font-bold text-ink dark:text-white">
                {action === "credit" ? "Credit" : "Reset"} Tokens
              </h3>
              <button onClick={() => setSelectedVendor(null)} className="text-mid-grey hover:text-ink dark:hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-v-body text-mid-grey">
                {action === "credit" ? "Add tokens to" : "Set balance for"}{" "}
                <span className="font-bold text-ink dark:text-white">{selectedVendor.businessName}</span>
              </p>

              <div>
                <label className="mb-1 block text-v-meta font-bold text-ink dark:text-white/70">
                  {action === "credit" ? "Tokens to add" : "New balance"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-line dark:border-white/15 bg-white dark:bg-surface-dark px-4 py-2.5 text-v-body text-ink dark:text-white outline-none focus:border-teal"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-1 block text-v-meta font-bold text-ink dark:text-white/70">Reason</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-line dark:border-white/15 bg-white dark:bg-surface-dark px-4 py-2.5 text-v-body text-ink dark:text-white outline-none focus:border-teal"
                  placeholder="e.g. Manual adjustment, compensation..."
                />
              </div>

              <button
                disabled={!amount || !reason || submitting}
                onClick={submitAction}
                className={cn(
                  "w-full rounded-lg py-2.5 text-v-body font-bold transition-opacity",
                  action === "credit"
                    ? "bg-teal text-white dark:bg-off-white dark:text-ink"
                    : "bg-error text-white",
                  "disabled:opacity-40",
                )}
              >
                {submitting ? "Processing..." : action === "credit" ? "Credit Tokens" : "Reset Balance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
      {historyVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setHistoryVendor(null)}>
          <div
            className="w-full max-w-lg rounded-xl border border-line dark:border-white/15 bg-white dark:bg-surface-dark overflow-hidden max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line dark:border-white/10 shrink-0">
              <h3 className="text-v-title font-bold text-ink dark:text-white">
                Token History — {historyVendor.businessName}
              </h3>
              <button onClick={() => setHistoryVendor(null)} className="text-mid-grey hover:text-ink dark:hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-5">
              {historyLoading ? (
                <p className="text-v-body text-mid-grey text-center py-4">Loading...</p>
              ) : history.length === 0 ? (
                <p className="text-v-body text-mid-grey text-center py-4">No transactions yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 rounded-lg border border-line dark:border-white/10 p-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        tx.type === "purchase" ? "bg-teal/10" :
                        tx.type === "usage" ? "bg-error/10" : "bg-warn/10",
                      )}>
                        {tx.type === "purchase" ? (
                          <ArrowDownLeft className="h-4 w-4 text-teal dark:text-off-white" />
                        ) : tx.type === "usage" ? (
                          <ArrowUpRight className="h-4 w-4 text-error" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-warn" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-v-body text-ink dark:text-white truncate">
                          {tx.description || tx.type}
                        </p>
                        <p className="text-v-meta text-mid-grey">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "text-v-body font-bold",
                          tx.amount > 0 ? "text-teal dark:text-off-white" : "text-error",
                        )}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </p>
                        <p className="text-v-meta text-mid-grey">bal: {tx.balance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
