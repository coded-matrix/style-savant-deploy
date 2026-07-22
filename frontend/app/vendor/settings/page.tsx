"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendor } from "@/context/VendorContext";
import { PageHeader, ConfirmDialog } from "@/components/vendor/shared";
import { clearVendorToken } from "@/lib/api/token";

export default function SettingsPage() {
  const router = useRouter();
  const { storefront, subscription, toast } = useVendor();
  const plan = ["starter", "growth", "pro"].indexOf(subscription.tier);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const [toggles, setToggles] = useState({
    ordersEmail: true,
    ordersApp: true,
    stockApp: true,
    payoutEmail: true,
    tokenApp: true,
    renewalEmail: true,
  });

  const logout = () => {
    setLogoutOpen(false);
    clearVendorToken();
    toast("Logged out.", "info");
    router.push("/vendor/login");
  };

  return (
    <div>
      <PageHeader title="Account & Settings" subtitle={storefront.businessName} />

      <div className="space-y-6 lg:space-y-8">
        {/* Desktop: profile + banking side-by-side */}
        <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-6 space-y-6 lg:space-y-0">
          <section className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5 lg:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal text-v-title font-bold text-white">
                {storefront.businessName[0] ?? "F"}
              </div>
              <div>
                <p className="text-v-tsm font-bold text-ink dark:text-white/90">{storefront.businessName}</p>
                <p className="text-v-meta text-vendor-text-grey">{storefront.businessName.toLowerCase().replace(/\s+/g, "")}@fashionhouse.com</p>
                <p className="text-v-meta text-vendor-text-grey">Contact via storefront</p>
              </div>
            </div>
            <button className="mt-4 text-v-body font-bold text-teal dark:text-off-white hover:underline">Edit Profile</button>
          </section>

          <section className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5 lg:p-6">
            <h3 className="text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Payout & Banking</h3>
            <p className="text-v-body text-vendor-text-grey">Ghana Commercial Bank · ****1234</p>
            <button className="mt-2 text-v-body font-bold text-teal dark:text-off-white hover:underline">Update bank details →</button>
          </section>
        </div>

        <section className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5 lg:p-6">
          <h3 className="mb-4 text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Notifications</h3>
          <ToggleRow label="New orders (Email)" checked={toggles.ordersEmail} onChange={(v) => setToggles((t) => ({ ...t, ordersEmail: v }))} />
          <ToggleRow label="New orders (In-app)" checked={toggles.ordersApp} onChange={(v) => setToggles((t) => ({ ...t, ordersApp: v }))} />
          <ToggleRow label="Low stock (In-app only)" checked={toggles.stockApp} onChange={(v) => setToggles((t) => ({ ...t, stockApp: v }))} />
          <ToggleRow label="Token low (In-app only)" checked={toggles.tokenApp} onChange={(v) => setToggles((t) => ({ ...t, tokenApp: v }))} />
          <ToggleRow label="Subscription renewal (Email)" checked={toggles.renewalEmail} onChange={(v) => setToggles((t) => ({ ...t, renewalEmail: v }))} />
        </section>

        {/* Desktop: security + subscription side-by-side */}
        <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-6 space-y-6 lg:space-y-0">
          <section className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5 lg:p-6">
            <h3 className="text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Security</h3>
            <button className="flex w-full items-center justify-between py-2.5 text-v-body text-teal dark:text-off-white hover:underline">
              Change password <ChevronRight className="h-3 w-3" />
            </button>
            <button className="flex w-full items-center justify-between py-2.5 text-v-body text-teal dark:text-off-white hover:underline">
              Active sessions <ChevronRight className="h-3 w-3" />
            </button>
          </section>

          <section className="rounded-xl border border-line bg-white dark:border-white/10 dark:bg-surface-dark p-5 lg:p-6">
            <h3 className="text-[11px] lg:text-v-cap font-bold uppercase tracking-[0.2em] text-mid-grey dark:text-white/40">Subscription</h3>
            <p className="text-v-body text-vendor-text-grey">
              {["Starter", "Growth", "Pro"][plan]} · {subscription.listingCap} listings · Renews{" "}
              {new Date(subscription.renewalDate).toLocaleDateString("en-GH")}
            </p>
            <Link href="/vendor/subscription/manage" className="mt-2 inline-block text-v-body font-bold text-teal dark:text-off-white hover:underline">
              Manage plan →
            </Link>
          </section>
        </div>

        <section className="rounded-xl border border-vendor-danger/20 bg-vendor-red-tint p-5 lg:p-6">
          <h3 className="text-v-tsm font-bold text-vendor-danger">Danger Zone</h3>
          <p className="mt-1 text-v-body text-ink dark:text-white/90">
            Deactivate your storefront. All listings will be hidden but orders still fulfilled.
          </p>
          <button
            onClick={() => setDeactivateOpen(true)}
            className="mt-3 rounded-full border border-vendor-danger/30 px-5 py-2 text-v-body font-bold text-vendor-danger hover:bg-vendor-danger/5 transition-colors"
          >
            Deactivate Storefront
          </button>
          <p className="mt-3 text-v-meta text-vendor-text-grey">
            To delete your account, contact CODED support.
          </p>
        </section>

        <button
          onClick={() => setLogoutOpen(true)}
          className="w-full rounded-full border border-line bg-white dark:border-white/10 dark:bg-surface-dark py-3 lg:h-btn-d text-v-tsm font-bold text-ink dark:text-white/90 hover:bg-surface-low dark:hover:bg-white/5 transition-colors"
        >
          <LogOut className="mr-2 inline h-4 w-4" /> Log Out
        </button>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Log out of this session?"
        confirmLabel="Yes, Log Out"
        onConfirm={logout}
      />
      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate your storefront?"
        description="All your listings will be hidden from buyers. Orders already placed will still be fulfilled."
        confirmLabel="Deactivate"
        destructive
        onConfirm={() => {
          setDeactivateOpen(false);
          toast("Storefront deactivated.", "info");
        }}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-2 text-left"
    >
      <span className="text-v-body text-ink dark:text-white/90">{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-teal" : "bg-line dark:bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white dark:bg-surface-dark transition-all",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
