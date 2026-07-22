"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { Search, Eye, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warn/10 text-warn",
  confirmed: "bg-surface-low text-mid-grey dark:bg-white/5 dark:text-white/60",
  processing: "bg-surface-low text-mid-grey dark:bg-white/5 dark:text-white/60",
  packed: "bg-ink/10 text-ink dark:bg-white/10 dark:text-white/80",
  shipped: "bg-ink/10 text-ink dark:bg-white/10 dark:text-white/80",
  delivered: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  cancelled: "bg-error/10 text-error",
};

interface OrderRow {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  userId: string;
  vendorId: string;
  userName: string | null;
  vendorName: string | null;
}

interface OrderDetail extends OrderRow {
  userEmail: string | null;
  shippingAddress: any;
  paymentReference: string | null;
  items: any[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await adminApi.listOrders({ status: statusFilter, page: p, limit: 15 });
      setOrders(res.orders);
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
  }, [statusFilter]);

  const viewOrder = async (id: string) => {
    setDetailLoading(true);
    try {
      const o = await adminApi.getOrder(id);
      setDetail(o);
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <h1 className="text-v-title font-bold text-ink dark:text-white mb-1">Orders</h1>
      <p className="text-v-meta text-mid-grey mb-6">Track all platform orders</p>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-v-meta font-medium transition-colors capitalize",
              statusFilter === s
                ? "border-teal bg-teal/10 text-teal dark:border-off-white dark:bg-off-white/10 dark:text-off-white"
                : "border-line dark:border-white/15 text-mid-grey hover:bg-surface-low dark:hover:bg-white/5",
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line dark:border-white/10 bg-surface-low dark:bg-white/[0.03]">
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Order</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Customer</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Vendor</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Amount</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Status</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Date</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-v-body text-mid-grey">Loading...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-v-body text-mid-grey">No orders found.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-line dark:border-white/5 last:border-0">
                    <td className="px-4 py-3 text-v-meta text-mid-grey font-mono">{o.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-v-body text-ink dark:text-white">{o.userName || "—"}</td>
                    <td className="px-4 py-3 text-v-body text-ink dark:text-white">{o.vendorName || "—"}</td>
                    <td className="px-4 py-3 text-v-body font-bold text-ink dark:text-white">
                      GHS {Number(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize",
                        STATUS_COLORS[o.status] || "bg-surface-low text-mid-grey dark:bg-white/5 dark:text-white/60",
                      )}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-v-meta text-mid-grey">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewOrder(o.id)}
                        className="text-mid-grey hover:text-teal dark:hover:text-off-white transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
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
            Page {page} of {totalPages} ({total} orders)
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

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div
            className="w-full max-w-lg rounded-xl border border-line dark:border-white/15 bg-white dark:bg-surface-dark overflow-hidden max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line dark:border-white/10 shrink-0">
              <h3 className="text-v-title font-bold text-ink dark:text-white">Order Detail</h3>
              <button onClick={() => setDetail(null)} className="text-mid-grey hover:text-ink dark:hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-5">
              {detailLoading ? (
                <p className="text-v-body text-mid-grey text-center py-4">Loading...</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Order ID" value={detail.id.slice(0, 12) + "..."} />
                    <Info label="Status" value={detail.status} />
                    <Info label="Customer" value={detail.userName || "—"} />
                    <Info label="Customer Email" value={detail.userEmail || "—"} />
                    <Info label="Vendor" value={detail.vendorName || "—"} />
                    <Info label="Total" value={`GHS ${Number(detail.totalAmount).toFixed(2)}`} />
                    <Info label="Payment Ref" value={detail.paymentReference || "—"} />
                    <Info label="Date" value={new Date(detail.createdAt).toLocaleString()} />
                  </div>

                  {detail.shippingAddress && (
                    <div className="rounded-lg border border-line dark:border-white/10 p-3">
                      <p className="text-v-meta font-bold text-mid-grey dark:text-white/50 mb-1">Shipping Address</p>
                      <p className="text-v-body text-ink dark:text-white">
                        {typeof detail.shippingAddress === "string"
                          ? detail.shippingAddress
                          : JSON.stringify(detail.shippingAddress)}
                      </p>
                    </div>
                  )}

                  {detail.items?.length > 0 && (
                    <div>
                      <p className="text-v-meta font-bold text-mid-grey dark:text-white/50 mb-2">Items</p>
                      <div className="space-y-2">
                        {detail.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-line dark:border-white/10 p-3">
                            <Package className="h-5 w-5 text-mid-grey shrink-0" />
                            <div className="flex-1">
                              <p className="text-v-body text-ink dark:text-white">
                                Product {item.productId?.slice(0, 8)}...
                                {item.size && ` · Size: ${item.size}`}
                                {item.color && ` · Color: ${item.color}`}
                              </p>
                              <p className="text-v-meta text-mid-grey">
                                Qty: {item.quantity} · GHS {Number(item.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-v-meta text-mid-grey dark:text-white/50">{label}</p>
      <p className="text-v-body font-medium text-ink dark:text-white">{value}</p>
    </div>
  );
}
