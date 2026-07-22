"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { Search, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({ search, role: roleFilter, page: p, limit: 15 });
      setUsers(res.users);
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
  }, [search, roleFilter]);

  const viewUser = async (id: string) => {
    setDetailLoading(true);
    try {
      const u = await adminApi.getUser(id);
      setSelectedUser(u);
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await adminApi.deleteUser(id);
      setSelectedUser(null);
      load();
    } catch {
      alert("Failed to delete user");
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <h1 className="text-v-title font-bold text-ink dark:text-white mb-1">Users</h1>
      <p className="text-v-meta text-mid-grey mb-6">Manage all platform users</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mid-grey" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-lg border border-line dark:border-white/15 bg-white dark:bg-surface-dark pl-9 pr-4 py-2.5 text-v-body text-ink dark:text-white placeholder:text-mid-grey outline-none focus:border-teal"
          />
        </div>
        <div className="flex gap-2">
          {["", "customer", "vendor", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-lg border px-3 py-2 text-v-meta font-medium transition-colors capitalize",
                roleFilter === r
                  ? "border-teal bg-teal/10 text-teal dark:border-off-white dark:bg-off-white/10 dark:text-off-white"
                  : "border-line dark:border-white/15 text-mid-grey hover:bg-surface-low dark:hover:bg-white/5",
              )}
            >
              {r || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line dark:border-white/10 bg-white dark:bg-surface-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line dark:border-white/10 bg-surface-low dark:bg-white/[0.03]">
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Name</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Email</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Role</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Joined</th>
                <th className="px-4 py-3 text-v-meta font-bold text-mid-grey dark:text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-v-body text-mid-grey">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-v-body text-mid-grey">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-line dark:border-white/5 last:border-0">
                    <td className="px-4 py-3 text-v-body text-ink dark:text-white">{u.name}</td>
                    <td className="px-4 py-3 text-v-body text-mid-grey">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[11px] font-bold capitalize",
                        u.role === "admin" ? "bg-error/10 text-error" :
                        u.role === "vendor" ? "bg-teal/10 text-teal dark:bg-off-white/10 dark:text-off-white" :
                        "bg-surface-low dark:bg-white/5 text-mid-grey",
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-v-meta text-mid-grey">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewUser(u.id)}
                        className="text-mid-grey hover:text-teal dark:hover:text-off-white transition-colors"
                        title="View user"
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
            Page {page} of {totalPages} ({total} users)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => { setPage(page - 1); load(page - 1); }}
              className="rounded-lg border border-line dark:border-white/15 p-2 text-mid-grey disabled:opacity-40 hover:bg-surface-low dark:hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => { setPage(page + 1); load(page + 1); }}
              className="rounded-lg border border-line dark:border-white/15 p-2 text-mid-grey disabled:opacity-40 hover:bg-surface-low dark:hover:bg-white/5"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedUser(null)}>
          <div
            className="w-full max-w-md rounded-xl border border-line dark:border-white/15 bg-white dark:bg-surface-dark overflow-hidden max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line dark:border-white/10 shrink-0">
              <h3 className="text-v-title font-bold text-ink dark:text-white">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-mid-grey hover:text-ink dark:hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              {detailLoading ? (
                <p className="text-v-body text-mid-grey text-center py-4">Loading...</p>
              ) : (
                <>
                  <Row label="Name" value={selectedUser.name} />
                  <Row label="Email" value={selectedUser.email} />
                  <Row label="Phone" value={selectedUser.phone || "—"} />
                  <Row label="Role" value={selectedUser.role} />
                  <Row label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
                  {selectedUser.vendor && (
                    <>
                      <div className="pt-2 border-t border-line dark:border-white/10">
                        <p className="text-v-meta font-bold text-mid-grey dark:text-white/50 mb-2">Vendor Profile</p>
                      </div>
                      <Row label="Business" value={selectedUser.vendor.businessName} />
                      <Row label="Category" value={selectedUser.vendor.category || "—"} />
                      <Row label="Verified" value={selectedUser.vendor.verified ? "Yes" : "No"} />
                      <Row label="Products" value={String(selectedUser.vendor.productsCount)} />
                    </>
                  )}
                  {selectedUser.tokenBalance && (
                    <>
                      <div className="pt-2 border-t border-line dark:border-white/10">
                        <p className="text-v-meta font-bold text-mid-grey dark:text-white/50 mb-2">Token Balance</p>
                      </div>
                      <Row label="Remaining" value={`${selectedUser.tokenBalance.tokensRemaining} tokens`} />
                      <Row label="Used" value={`${selectedUser.tokenBalance.tokensUsed} tokens`} />
                      <Row label="Total" value={`${selectedUser.tokenBalance.tokensTotal} tokens`} />
                    </>
                  )}
                  <div className="pt-3 border-t border-line dark:border-white/10 flex justify-end">
                    <button
                      onClick={() => deleteUser(selectedUser.id)}
                      className="flex items-center gap-1 rounded-lg bg-error/10 px-3 py-2 text-v-body font-bold text-error hover:bg-error/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Delete User
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-v-meta text-mid-grey dark:text-white/50 shrink-0">{label}</span>
      <span className="text-v-body font-medium text-ink dark:text-white text-right break-words min-w-0">{value}</span>
    </div>
  );
}
