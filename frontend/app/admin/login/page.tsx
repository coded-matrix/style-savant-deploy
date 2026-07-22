"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiJson } from "@/lib/api/client";
import { setAdminToken } from "@/lib/api/token";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setError("");
  };

  const valid = form.email.length > 0 && form.password.length > 0;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiJson<any>("/api/backend/auth/login", {
        method: "POST",
        body: { email: form.email, password: form.password },
      });
      if (!res?.token) {
        setError(res?.error || "Login failed — no token returned");
        return;
      }
      // Store under admin key — separate from vendor and consumer tokens
      setAdminToken(res.token);
      let payload: any;
      try {
        payload = JSON.parse(atob(res.token.split(".")[1]));
      } catch {
        setError("Invalid token received");
        return;
      }
      if (payload.role !== "admin") {
        setError("This account is not an admin.");
        return;
      }
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-bright dark:bg-canvas-dark px-5 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink dark:bg-white">
          <Shield className="h-8 w-8 text-white dark:text-ink" />
        </div>
        <h1 className="font-serif text-v-hero font-normal leading-[0.95] tracking-[-0.02em] text-ink dark:text-white">
          Admin Portal
        </h1>
        <p className="text-sm text-mid-grey mt-2 font-sans uppercase tracking-[0.15em]">Style Savant</p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-6 dark:border-white/10 dark:bg-surface-dark">
        <div>
          <label className="mb-1 block text-v-body text-mid-grey">Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="h-[52px] w-full rounded-md border border-line bg-white px-4 text-v-body text-ink outline-none transition-colors focus:border-teal dark:border-white/10 dark:bg-white/[0.06] dark:text-white/90"
          />
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-v-body text-mid-grey">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="h-[52px] w-full rounded-md border border-line bg-white px-4 text-v-body text-ink outline-none transition-colors focus:border-teal dark:border-white/10 dark:bg-white/[0.06] dark:text-white/90"
          />
        </div>

        {error && (
          <p className="mt-3 text-v-meta text-error">{error}</p>
        )}

        <button
          onClick={submit}
          disabled={!valid || submitting}
          className={cn(
            "mt-6 flex h-[52px] w-full items-center justify-center rounded-full font-bold transition-opacity",
            valid && !submitting
              ? "bg-ink text-white dark:bg-white dark:text-ink"
              : "bg-ink/50 text-white/70 dark:bg-white/20 dark:text-white/50",
          )}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
        </button>
      </div>
    </div>
  );
}
