"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/consumer/Input";
import { Button } from "@/components/consumer/Button";
import { Logo } from "@/components/consumer/Logo";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { setUser, toast, user } = useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const canSubmit =
    email.trim() && password.trim() && (mode === "login" || confirm.trim());

  const submit = async () => {
    setErrors({});

    if (mode === "signup" && password !== confirm) {
      setErrors({ confirm: "Passwords do not match." });
      return;
    }

    if (password.length < 8 && mode === "signup") {
      setErrors({ password: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);

    try {
      const data =
        mode === "signup"
          ? await authApi.register({
              email,
              password,
              name: user.username === "Guest" ? email.split("@")[0] : user.username,
              role: "customer",
            })
          : await authApi.login({ email, password });

      setUser({
        isGuest: false,
        email: data.user.email,
        username: data.user.name,
        avatar: data.user.avatar ? `data:image/jpeg;base64,${data.user.avatar}` : undefined,
        fitProfile: {
          ...user.fitProfile,
          photo: data.user.fitPhoto ? `data:image/jpeg;base64,${data.user.fitPhoto}` : user.fitProfile?.photo,
        },
      });

      toast(
        mode === "login"
          ? `Welcome back, ${data.user.name}!`
          : "Account created! Welcome to Style Savant.",
        "success",
      );
      router.back();
    } catch (err) {
      if (err instanceof ApiError) {
        const payload = err.payload as
          | string
          | { error?: string | Record<string, string[]> }
          | null;

        if (typeof payload === "object" && payload && "error" in payload) {
          const e = payload.error;
          if (typeof e === "string") {
            if (mode === "login" && err.status === 401) {
              setErrors({ password: "Incorrect email or password." });
            } else if (err.status === 409) {
              setErrors({ email: "An account with this email already exists." });
              setMode("login");
            } else if (e.toLowerCase().includes("email")) {
              setErrors({ email: e });
            } else if (e.toLowerCase().includes("password")) {
              setErrors({ password: e });
            } else {
              toast(e, "error");
            }
          } else if (e && typeof e === "object") {
            const fieldErrors = e as Record<string, string[]>;
            setErrors({
              email: fieldErrors.email?.[0],
              password: fieldErrors.password?.[0],
            });
          }
        } else {
          toast("Authentication failed. Please try again.", "error");
        }
      } else {
        toast(
          err instanceof Error ? err.message : "Authentication failed.",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-canvas-dark">
      <div className="no-scrollbar flex-1 overflow-y-auto px-page-x pt-8 pb-6">
        <div className="flex flex-col items-center">
          <Logo mono="auto" size={56} />
          <h1 className="mt-4 font-serif text-headline-lg text-ink dark:text-off-white">
            {mode === "login" ? "Welcome back" : "Join Style Savant"}
          </h1>
        </div>

        {/* toggle */}
        <div className="mx-auto mt-6 flex w-full max-w-[320px] gap-6 border-b border-line dark:border-white/10">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErrors({});
              }}
              className={cn(
                "-mb-px border-b-2 pb-2.5 font-display text-sm font-bold transition-colors",
                mode === m ? "border-coral text-ink dark:text-off-white" : "border-transparent text-mid-grey dark:text-white/60",
              )}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-6 w-full max-w-[320px] space-y-3.5">
          <Input
            label="Email or phone"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            state={errors.email ? "error" : "idle"}
            errorText={errors.email}
            type="email"
            autoComplete="email"
          />
          <div>
            <Input
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type={showPw ? "text" : "password"}
              state={errors.password ? "error" : "idle"}
              errorText={errors.password}
              rightSlot={
                <button
                  onClick={() => setShowPw((v) => !v)}
                  aria-label="Show password"
                  className="text-mid-grey"
                >
                  {showPw ? (
                    <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                  )}
                </button>
              }
            />
            {mode === "login" && (
              <button
                onClick={() => toast("Password reset link sent.", "success")}
                className="mt-1.5 block font-display text-[13px] font-bold text-teal hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          {mode === "signup" && (
            <Input
              label="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              type={showPw ? "text" : "password"}
              state={errors.confirm ? "error" : "idle"}
              errorText={errors.confirm}
            />
          )}

          <Button
            variant="coral"
            full
            loading={loading}
            disabled={!canSubmit}
            onClick={submit}
          >
            {mode === "login" ? "Log In" : "Create Account"}
          </Button>

          {mode === "signup" && (
            <p className="text-center text-caption text-mid-grey dark:text-zinc-400">
              By continuing you agree to our{" "}
              <button
                onClick={() => toast("Terms.", "neutral")}
                className="font-bold text-teal hover:underline"
              >
                Terms
              </button>{" "}
              and{" "}
              <button
                onClick={() => toast("Privacy Policy.", "neutral")}
                className="font-bold text-teal hover:underline"
              >
                Privacy Policy
              </button>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
