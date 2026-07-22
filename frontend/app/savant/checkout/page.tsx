"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/consumer/store";
import { GHANA_REGIONS } from "@/lib/consumer/data";
import { ghs } from "@/lib/consumer/format";
import { Input } from "@/components/consumer/Input";
import { Button } from "@/components/consumer/Button";
import { BottomSheet } from "@/components/consumer/BottomSheet";
import { BottomNav } from "@/components/consumer/BottomNav";
import { SmartImage } from "@/components/consumer/SmartImage";
import { orderApi } from "@/lib/api/order";
import { measurementApi, toValues, inToCm, MeasurementField } from "@/lib/api/measurement";
import type { Address } from "@/lib/consumer/types";

type Step = 1 | 2;

/**
 * WhatsApp-first checkout: the platform does not process payments or returns.
 * The customer fills in their delivery details, then hands the order to each
 * business over WhatsApp — payment and delivery are settled directly between
 * them on chat.
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, createOrder, toast, user, productById, vendorById } = useApp();
  const [step, setStep] = useState<Step>(1);
  const [exitOpen, setExitOpen] = useState(false);
  const [sentVendors, setSentVendors] = useState<Set<string>>(new Set());

  const nameParts = (user.username || "").split(" ");
  const defaultFirst = user.isGuest ? "" : nameParts[0] || "";
  const defaultLast = user.isGuest ? "" : nameParts.slice(1).join(" ") || "";
  const [firstName, setFirstName] = useState(defaultFirst);
  const [lastName, setLastName] = useState(defaultLast);
  const [phone, setPhone] = useState("");

  const [form, setForm] = useState<Address>({
    name: user.isGuest ? "" : user.username,
    phone: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    ghanaPostGps: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Address | "firstName" | "lastName", string>>>({});

  // Tailor measurements, attached to the order so a vendor can cut to fit.
  const [measurements, setMeasurements] = useState<Partial<Record<MeasurementField, number>>>({});
  const [measureUnit, setMeasureUnit] = useState<"in" | "cm">("in");
  const [includeMeasurements, setIncludeMeasurements] = useState(true);

  useEffect(() => {
    if (user.isGuest) return;
    measurementApi
      .getMyMeasurement()
      .then((m) => setMeasurements(toValues(m)))
      .catch(() => setMeasurements({}));
  }, [user.isGuest]);

  const MEASURE_LABELS: Partial<Record<MeasurementField, string>> = {
    chest: "Chest", bust: "Bust", underbust: "Underbust",
    shoulderWidth: "Shoulder", neck: "Neck", sleeveLength: "Sleeve",
    bicep: "Bicep", wrist: "Wrist", backLength: "Back length",
    waist: "Waist", hips: "Hips", thigh: "Thigh", knee: "Knee",
    calf: "Calf", inseam: "Inseam", outseam: "Outseam", height: "Height",
  };

  const measurementLines = useMemo(() => {
    if (!includeMeasurements) return [];
    return (Object.keys(MEASURE_LABELS) as MeasurementField[])
      .filter((k) => measurements[k] != null)
      .map((k) => {
        const inches = measurements[k]!;
        const v = measureUnit === "in"
          ? `${Math.round(inches * 100) / 100} in`
          : `${Math.round(inToCm(inches) * 10) / 10} cm`;
        return `- ${MEASURE_LABELS[k]}: ${v}`;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurements, measureUnit, includeMeasurements]);

  // Group the cart per business — each business gets its own WhatsApp order.
  const vendorGroups = (() => {
    const groups = new Map<string, { vendorId: string; items: typeof cart }>();
    for (const item of cart) {
      const p = productById(item.productId);
      if (!p) continue;
      const g = groups.get(p.vendorId) ?? { vendorId: p.vendorId, items: [] as typeof cart };
      g.items.push(item);
      groups.set(p.vendorId, g);
    }
    return [...groups.values()];
  })();

  const validate = (): boolean => {
    const e: Partial<Record<keyof Address | "firstName" | "lastName", string>> = {};
    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim()) e.lastName = "Last name is required.";
    if (!phone.trim()) e.phone = "Phone number is required.";
    if (!form.line1.trim()) e.line1 = "Address is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.region) e.region = "Select a region.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toReview = () => {
    if (validate()) {
      setForm((p) => ({ ...p, name: `${firstName} ${lastName}`, phone }));
      setStep(2);
    } else {
      toast("Please fill in all delivery details.", "warn");
    }
  };

  const groupSubtotal = (items: typeof cart) =>
    items.reduce((sum, c) => sum + (productById(c.productId)?.priceGHS ?? 0) * c.qty, 0);

  /**
   * Compose the WhatsApp message. Plain readable text only — WhatsApp has no
   * code formatting, so a raw JSON blob arrives as unreadable braces and
   * quotes. A vendor reads this on a phone and needs to act on it directly.
   */
  const buildMessage = (items: typeof cart, orderRef: string) => {
    const customerName = `${firstName} ${lastName}`.trim();
    const lines: string[] = [];

    lines.push(`New Style Savant order — ${orderRef}`);
    lines.push("");

    lines.push("ITEMS");
    for (const c of items) {
      const p = productById(c.productId);
      const variant = [c.size && `size ${c.size}`, c.color].filter(Boolean).join(", ");
      lines.push(
        `- ${p?.name ?? "Item"}${variant ? ` (${variant})` : ""} x${c.qty} — ${ghs((p?.priceGHS ?? 0) * c.qty)}`,
      );
    }
    lines.push(`Total: ${ghs(groupSubtotal(items))}`);
    lines.push("");

    lines.push("CUSTOMER");
    lines.push(`${customerName}`);
    lines.push(`${phone}`);
    lines.push("");

    lines.push("DELIVERY");
    lines.push(form.line1);
    if (form.line2) lines.push(form.line2);
    lines.push(`${form.city}, ${form.region}`);
    if (form.ghanaPostGps) lines.push(`GPS: ${form.ghanaPostGps}`);

    // Bespoke work needs the tailor sheet; only send what's actually filled in.
    if (measurementLines.length > 0) {
      lines.push("");
      lines.push(`MEASUREMENTS (${measureUnit === "in" ? "inches" : "cm"})`);
      lines.push(...measurementLines);
    }

    return lines.join("\n");
  };

  const waNumber = (vendorId: string): string | null => {
    const raw = vendorById(vendorId)?.businessWhatsapp;
    if (!raw) return null;
    const digits = raw.replace(/[^\d]/g, "");
    return digits.length >= 9 ? digits : null;
  };

  const sendToVendor = async (vendorId: string, items: typeof cart) => {
    const number = waNumber(vendorId);
    if (!number) {
      toast("This business hasn't set up WhatsApp ordering yet.", "error");
      return;
    }

    const address = { ...form, name: `${firstName} ${lastName}`, phone };
    const order = createOrder(address, "WhatsApp");

    // Record the order for both sides (best-effort — the WhatsApp message is
    // the source of truth for fulfillment).
    try {
      await orderApi.createOrder({
        items: items.map((c) => ({
          productId: c.productId,
          size: c.size,
          color: c.color,
          qty: c.qty,
        })),
        shippingAddress: address,
        paymentMethod: "WhatsApp",
      });
    } catch {
      // non-blocking
    }

    const text = encodeURIComponent(buildMessage(items, order.id));
    window.open(`https://wa.me/${number}?text=${text}`, "_blank", "noopener");

    setSentVendors((prev) => new Set(prev).add(vendorId));
    toast("Order sent — finish the chat on WhatsApp.", "success");

    // Once every business has received its order, wrap up.
    if (vendorGroups.every((g) => g.vendorId === vendorId || sentVendors.has(g.vendorId))) {
      setTimeout(() => router.replace(`/savant/order/${order.id}`), 1200);
    }
  };

  const set = (k: keyof Address, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  return (
    <div className="relative flex h-full flex-col bg-surface-bright dark:bg-canvas-dark overflow-hidden pb-[76px] font-body text-body-md">
      {/* Mobile TopAppBar */}
      <header className="z-30 flex h-14 shrink-0 items-center bg-surface-bright px-page-x justify-between relative dark:bg-surface-dark dark:border-white/10">
        <button
          onClick={() => setExitOpen(true)}
          aria-label="Back"
          className="text-ink dark:text-white hover:opacity-80 active:scale-95 transition-transform shrink-0 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <h1 className="font-display text-[18px] leading-[24px] font-bold text-ink dark:text-white">
          Style Savant
        </h1>
        <span className="w-6" />
      </header>

      {/* Stepper */}
      <div className="flex shrink-0 items-center justify-center px-page-x pb-6 pt-2">
        <div className="flex items-center w-full max-w-[240px] justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-surface dark:bg-white/5 z-0" />
          <div className="absolute top-4 left-0 h-0.5 bg-teal z-0 transition-all duration-300" style={{ width: step === 1 ? "0%" : "100%" }} />

          <div className="flex flex-col items-center z-10">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-display text-[13px] font-bold transition-colors",
              step > 1 ? "bg-teal text-white" : "bg-teal text-white ring-4 ring-teal/20"
            )}>
              {step > 1 ? <span className="material-symbols-outlined text-[16px] font-bold">check</span> : "1"}
            </div>
            <span className="text-[10px] font-bold mt-1 text-teal">Details</span>
          </div>

          <div className="flex flex-col items-center z-10">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-display text-[13px] font-bold transition-colors",
              step === 2 ? "bg-teal text-white ring-4 ring-teal/20" : "bg-white dark:bg-surface-dark border border-line text-mid-grey dark:text-white/60"
            )}>
              2
            </div>
            <span className={cn("text-[10px] font-bold mt-1", step === 2 ? "text-teal" : "text-mid-grey dark:text-white/60")}>WhatsApp</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-page-x pb-28 pt-2">
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-line/20 dark:bg-surface-dark dark:border-white/10">
              <h3 className="font-display text-[18px] leading-[24px] font-bold text-ink dark:text-off-white mb-4">Delivery Details</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      label="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Kwame"
                      state={errors.firstName ? "error" : "idle"}
                      errorText={errors.firstName}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Mensah"
                      state={errors.lastName ? "error" : "idle"}
                      errorText={errors.lastName}
                    />
                  </div>
                </div>
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="054 XXX XXXX"
                  inputMode="tel"
                  state={errors.phone ? "error" : "idle"}
                  errorText={errors.phone}
                />
                <Input
                  label="Street Address"
                  value={form.line1}
                  onChange={(e) => set("line1", e.target.value)}
                  placeholder="42 Independence Ave"
                  state={errors.line1 ? "error" : "idle"}
                  errorText={errors.line1}
                />
                <Input
                  label="City"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Accra"
                  state={errors.city ? "error" : "idle"}
                  errorText={errors.city}
                />
                <div>
                  <label className="mb-1.5 block text-label-bold text-ink dark:text-off-white">Region</label>
                  <div className="relative">
                    <select
                      value={form.region}
                      onChange={(e) => set("region", e.target.value)}
                      className={cn(
                        "h-12 w-full appearance-none rounded-input border-2 bg-white pl-3.5 pr-10 text-body-md focus:outline-none dark:bg-surface-dark",
                        errors.region ? "border-error" : "border-line focus:border-teal"
                      )}
                    >
                      <option value="">Select region…</option>
                      {GHANA_REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                        <span className="material-symbols-outlined text-[20px] text-mid-grey dark:text-white/60">expand_more</span>
                    </div>
                  </div>
                  {errors.region && <p className="mt-1.5 text-caption text-error">{errors.region}</p>}
                </div>
              </div>
            </div>

            <Button
              variant="coral"
              size="md"
              full
              className="shadow-md"
              onClick={toReview}
            >
              Review &amp; Send via WhatsApp
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* How it works */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-line/20 dark:bg-surface-dark dark:border-white/10 flex items-start gap-3">
              <span className="material-symbols-outlined text-[22px] text-teal mt-0.5">chat</span>
              <p className="text-[13px] text-mid-grey dark:text-white/60">
                Your order opens in WhatsApp with all the details attached. You&apos;ll agree on{" "}
                <span className="font-bold text-ink dark:text-off-white">payment (MoMo or cash) and delivery</span>{" "}
                directly with the business in the chat.
              </p>
            </div>

            {/* Measurements — only shown when the shopper actually has some */}
            {Object.keys(measurements).length > 0 ? (
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-line/20 dark:bg-surface-dark dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[14px] font-bold text-ink dark:text-off-white">
                      Send my measurements
                    </p>
                    <p className="mt-0.5 text-[12px] text-mid-grey dark:text-white/60">
                      {Object.keys(measurements).length} measurements — helps with bespoke fitting
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={includeMeasurements}
                    aria-label="Include my measurements"
                    onClick={() => setIncludeMeasurements((v) => !v)}
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                      includeMeasurements ? "bg-teal" : "bg-surface-dim dark:bg-white/15",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
                        includeMeasurements ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  </button>
                </div>

                {includeMeasurements ? (
                  <div className="mt-3 flex items-center gap-2 border-t border-line/20 pt-3 dark:border-white/10">
                    <span className="text-[12px] text-mid-grey dark:text-white/60">Send as</span>
                    <div className="flex items-center rounded-full bg-surface-low p-0.5 dark:bg-white/10">
                      {(["in", "cm"] as const).map((u) => (
                        <button
                          key={u}
                          onClick={() => setMeasureUnit(u)}
                          className={cn(
                            "rounded-full px-3 py-1 text-[12px] font-bold transition-colors",
                            measureUnit === u
                              ? "bg-ink text-white dark:bg-white dark:text-ink"
                              : "text-mid-grey dark:text-white/60",
                          )}
                        >
                          {u === "in" ? "Inches" : "cm"}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* One order card per business */}
            {vendorGroups.map(({ vendorId, items }) => {
              const vendor = vendorById(vendorId);
              const hasWa = !!waNumber(vendorId);
              const sent = sentVendors.has(vendorId);
              return (
                <div key={vendorId} className="rounded-[24px] bg-dark-grey p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-[16px] font-bold">{vendor?.name ?? "Business"}</h3>
                    {sent ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#25D366]">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> Sent
                      </span>
                    ) : null}
                  </div>
                  <ul className="space-y-4">
                    {items.map((item) => {
                      const p = productById(item.productId);
                      if (!p) return null;
                      return (
                        <li key={item.id} className="flex justify-between items-center text-[13px] text-white/90">
                          <div className="flex items-center gap-3">
                            <span className="h-12 w-10 overflow-hidden rounded-lg shrink-0 bg-white/10 ring-1 ring-white/20">
                              <SmartImage src={p.images[0]} alt={p.name} seed={p.id} className="h-full w-full object-cover" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold truncate max-w-[140px]">{p.name}</p>
                              <p className="text-[11px] text-white/60">Size: {item.size} | Qty: {item.qty}</p>
                            </div>
                          </div>
                          <span className="shrink-0 font-bold">{ghs(p.priceGHS * item.qty)}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="my-4 h-px bg-white/10" />
                  <div className="flex justify-between font-display text-[15px] font-bold mb-5">
                    <span>Subtotal</span>
                    <span className="text-coral-bright">{ghs(groupSubtotal(items))}</span>
                  </div>

                  <button
                    onClick={() => sendToVendor(vendorId, items)}
                    disabled={!hasWa}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-display text-[14px] font-bold transition-opacity",
                      hasWa
                        ? "bg-[#25D366] text-white hover:opacity-90"
                        : "bg-white/10 text-white/40 cursor-not-allowed"
                    )}
                  >
                    {/* WhatsApp glyph */}
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.33 4.95L2 22l5.3-1.39a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
                    </svg>
                    {sent ? "Send again" : "Send order on WhatsApp"}
                  </button>
                  {!hasWa ? (
                    <p className="mt-2 text-center text-[11px] text-white/50">
                      This business hasn&apos;t added a WhatsApp number yet.
                    </p>
                  ) : null}
                </div>
              );
            })}

            <p className="text-center text-[11px] text-mid-grey dark:text-white/40 px-4">
              Style Savant doesn&apos;t process payments or returns — every order is completed
              directly with the business on WhatsApp.
            </p>
          </div>
        )}
      </div>

      {/* exit confirm sheet */}
      <BottomSheet
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        height={38}
        bare
        fitContent
        footer={
          <div className="flex gap-3">
            <Button variant="greyOutline" className="flex-1" onClick={() => setExitOpen(false)}>Keep checkout</Button>
            <Button variant="coral" className="flex-1" onClick={() => { setExitOpen(false); router.replace("/savant/cart"); }}>
              Leave
            </Button>
          </div>
        }
      >
        <div className="px-2 pt-4 text-center">
          <p className="font-display text-title-md text-ink dark:text-off-white">Leave checkout?</p>
          <p className="mt-1 text-body-md text-mid-grey dark:text-white/60">Your cart will be saved.</p>
        </div>
      </BottomSheet>

      <BottomNav />
    </div>
  );
}
