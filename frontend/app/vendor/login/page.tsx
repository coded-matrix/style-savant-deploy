"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api/auth";
import { Logo } from "@/components/consumer/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
  };

  const valid = form.email && form.password.length >= 8;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError("");
    try {
      await authApi.login({
        email: form.email,
        password: form.password,
      });
      // Token is automatically stored by authApi.login()
      router.push("/vendor/dashboard");
    } catch (err: unknown) {
      console.error("Login failed:", err);
      setError("Invalid email or password, or backend is unreachable.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-teal px-5 py-8">
      <div className="mb-8 text-center text-white">
        <Logo mono="light" size={64} className="mb-4" />
        <h1 className="font-serif text-v-hero font-normal leading-[0.95] tracking-[-0.02em]">Style Savant</h1>
        <p className="text-sm text-white/70 mt-3 font-sans uppercase tracking-[0.15em]">Vendor Portal</p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <Input
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(v) => set("email", v)}
        />
        <div className="mt-4">
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => set("password", v)}
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
              ? "bg-teal text-white active:opacity-90"
              : "bg-teal/50 text-white/70",
          )}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Log In"}
        </button>

        <p className="mt-5 text-center text-v-body text-mid-grey">
          Don&apos;t have an account?{" "}
          <Link href="/vendor/signup" className="text-teal dark:text-off-white font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-v-body text-mid-grey">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[52px] w-full rounded-md border border-line bg-white px-4 text-v-body text-ink outline-none transition-colors focus:border-teal dark:border-white/10 dark:bg-white/[0.06] dark:text-white/90"
      />
    </div>
  );
}
