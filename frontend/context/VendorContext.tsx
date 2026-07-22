"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AppNotification,
  Backdrop,
  Campaign,
  Order,
  Product,
  StorefrontSettings,
  Subscription,
  TokenUsageEntry,
  TopUpHistory,
} from "@/lib/vendor/types";
import {
  DEFAULT_STOREFRONT,
  seedBackdrops,
  seedCampaigns,
  seedNotifications,
  seedOrders,
  seedProducts,
  seedSubscription,
  seedTokenUsage,
  seedTopUpHistory,
} from "@/lib/vendor/seed";
import { vendorApi, hasAuthToken, type PayoutData } from "@/lib/api/vendor";

const EMPTY_PAYOUTS: PayoutData = {
  netEarnings: 0,
  totalSales: 0,
  availablePayout: 0,
  bankConnected: false,
  bankName: "",
  accountNumber: "",
};

export type ToastType = "success" | "error" | "info";
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface PaywallState {
  open: boolean;
  cost: number;
  feature: string;
  onProceed?: () => void;
}

interface VendorState {
  tokens: number;
  products: Product[];
  orders: Order[];
  notifications: AppNotification[];
  subscription: Subscription;
  campaigns: Campaign[];
  backdrops: Backdrop[];
  storefront: StorefrontSettings;
  tokenUsage: TokenUsageEntry[];
  topUpHistory: TopUpHistory[];
  payouts: PayoutData;
}

const initialState: VendorState = {
  tokens: 120,
  products: seedProducts(),
  orders: seedOrders(),
  notifications: seedNotifications(),
  subscription: seedSubscription(),
  campaigns: seedCampaigns(),
  backdrops: seedBackdrops(),
  storefront: DEFAULT_STOREFRONT,
  tokenUsage: seedTokenUsage(),
  topUpHistory: seedTopUpHistory(),
  payouts: EMPTY_PAYOUTS,
};

interface VendorContextValue extends VendorState {
  addTokens: (n: number) => void;
  spendTokens: (n: number) => boolean;
  requestSpend: (cost: number, action: () => void, feature?: string) => void;
  paywall: PaywallState;
  closePaywall: () => void;
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  updateStock: (id: string, stock: number) => void;
  deleteProduct: (id: string) => void;
  archiveProduct: (id: string) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  addNotification: (n: Omit<AppNotification, "id">) => void;
  markAllRead: () => void;
  setSubscription: (s: Subscription) => void;
  addCampaign: (c: Campaign) => void;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  addBackdrop: (b: Backdrop) => void;
  updateStorefront: (patch: Partial<StorefrontSettings>) => void;
  recordUsage: (feature: string, tokens: number) => void;
  addTopUp: (t: TopUpHistory) => void;
}

const VendorContext = createContext<VendorContextValue | null>(null);

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VendorState>(initialState);
  const [paywall, setPaywall] = useState<PaywallState>({
    open: false,
    cost: 0,
    feature: "AI action",
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proceedRef = useRef<(() => void) | undefined>(undefined);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load backend data on mount if an auth token exists.
  // The vendorApi mappers handle all shape transformations.
  useEffect(() => {
    if (!hasAuthToken()) return;

    async function loadBackendData() {
      const safeFetch = async <T,>(fetcher: () => Promise<T>, fallback: T): Promise<T> => {
        try {
          return await fetcher();
        } catch (e) {
          console.error("Failed to fetch backend data", e);
          return fallback;
        }
      };

      try {
        const defaultTokenBalance = {
          vendorId: "",
          tokensRemaining: 500,
          tokensTotal: 500,
          tokensUsed: 0,
          status: "active" as const,
          lowBalanceAlert: false,
        };

        const [dash, storefront, productsList, ordersList, campaignsList, payoutsData, tokenBalance] = await Promise.all([
          safeFetch(vendorApi.getDashboard, {
            businessName: "",
            logo: null,
            verified: false,
            activeListings: 0,
            pendingOrders: 0,
            totalSales: 0,
            netEarnings: 0,
            tokenBalance: defaultTokenBalance,
          }),
          safeFetch(vendorApi.getStorefront, DEFAULT_STOREFRONT),
          safeFetch(vendorApi.getProducts, seedProducts()),
          safeFetch(vendorApi.getOrders, seedOrders()),
          safeFetch(vendorApi.getCampaigns, seedCampaigns()),
          safeFetch(vendorApi.getPayouts, EMPTY_PAYOUTS),
          safeFetch(vendorApi.getTokensBalance, defaultTokenBalance),
        ]);

        const notificationsList = await safeFetch(vendorApi.getNotifications, seedNotifications());

        setState({
          // Prefer the dedicated token-balance endpoint; fall back to the
          // balance embedded in the dashboard payload.
          tokens: tokenBalance.tokensRemaining ?? dash.tokenBalance.tokensRemaining,
          products: productsList, // Already mapped by vendorApi.getProducts()
          orders: ordersList,     // Already mapped by vendorApi.getOrders()
          notifications: notificationsList, // Already mapped by vendorApi.getNotifications()
          subscription: {
            tier: dash.tokenBalance.tokensTotal > 3000 ? "pro" : dash.tokenBalance.tokensTotal > 500 ? "growth" : "starter",
            renewalDate: new Date(Date.now() + 15 * 86400000).toISOString(),
            listingCap: dash.tokenBalance.tokensTotal > 3000 ? 500 : dash.tokenBalance.tokensTotal > 500 ? 100 : 10,
            tokenAllowance: dash.tokenBalance.tokensTotal,
            tokensUsed: dash.tokenBalance.tokensUsed,
          },
          campaigns: campaignsList, // Already mapped by vendorApi.getCampaigns()
          backdrops: seedBackdrops(),
          storefront,              // Already mapped by vendorApi.getStorefront()
          tokenUsage: [
            { feature: "Campaign Creation", calls: campaignsList.length, tokens: campaignsList.length * 80 },
          ],
          topUpHistory: [],
          payouts: payoutsData,
        });
      } catch (err) {
        console.error("Failed to load vendor backend data:", err);
        // Keep seed data as fallback — portal remains fully functional
      }
    }

    loadBackendData();
  }, [toast]);

  /* ------------------------------------------------------------------ */
  /*  Token operations                                                   */
  /* ------------------------------------------------------------------ */

  const addTokens = useCallback(async (n: number) => {
    // Optimistic: update local state immediately
    setState((prev) => ({ ...prev, tokens: prev.tokens + n }));

    if (hasAuthToken()) {
      try {
        const ref = `topup-${Date.now()}`;
        await vendorApi.buyTokens(n, ref);
        toast(`Successfully purchased ${n} tokens`, "success");
      } catch (err) {
        console.error("Failed to buy tokens:", err);
        // Revert optimistic update
        setState((prev) => ({ ...prev, tokens: prev.tokens - n }));
        toast("Token purchase failed", "error");
      }
    } else {
      toast(`+${n} tokens added (demo mode)`, "success");
    }
  }, [toast]);

  const spendTokens = useCallback((n: number): boolean => {
    let ok = false;
    setState((prev) => {
      if (prev.tokens >= n) {
        ok = true;
        return { ...prev, tokens: prev.tokens - n };
      }
      return prev;
    });
    return ok;
  }, []);

  const requestSpend = useCallback(
    (cost: number, action: () => void, feature = "AI action") => {
      const doAction = () => {
        spendTokens(cost);
        action();
      };
      if (state.tokens >= cost) {
        doAction();
      } else {
        proceedRef.current = doAction;
        setPaywall({ open: true, cost, feature, onProceed: doAction });
      }
    },
    [state.tokens, spendTokens],
  );

  const closePaywall = useCallback(() => {
    proceedRef.current = undefined;
    setPaywall((prev) => ({ ...prev, open: false }));
  }, []);

  const addTopUp = useCallback((t: TopUpHistory) => {
    setState((prev) => ({ ...prev, topUpHistory: [t, ...prev.topUpHistory] }));
  }, []);

  const buyAndProceed = useCallback(
    (bundleTokens: number, ghs: number, action?: () => void) => {
      addTokens(bundleTokens);
      addTopUp({ date: new Date().toISOString(), tokens: bundleTokens, ghs });
      const run = action ?? proceedRef.current;
      proceedRef.current = undefined;
      setPaywall((prev) => ({ ...prev, open: false }));
      toast(`+${bundleTokens.toLocaleString()} tokens added to your wallet!`, "success");
      if (run) {
        // Spend the originally-required amount now that balance is sufficient.
        setTimeout(() => {
          run();
        }, 60);
      }
    },
    [addTokens, addTopUp, toast],
  );

  /* ------------------------------------------------------------------ */
  /*  Product operations — optimistic local-first                        */
  /* ------------------------------------------------------------------ */

  const addProduct = useCallback(async (p: Product) => {
    // 1. Optimistic: add to local state immediately
    setState((prev) => ({ ...prev, products: [p, ...prev.products] }));

    // 2. Sync to backend if authenticated
    if (hasAuthToken()) {
      try {
        const formData = new FormData();
        formData.append("name", p.name);
        formData.append("description", p.description || "");
        if (p.sku) formData.append("sku", p.sku);
        formData.append("price", String(p.price));
        formData.append("category", p.category);
        formData.append("stock", String(p.stock));
        formData.append("requiresMeasurements", String(p.bespoke));
        formData.append("published", String(p.status === "active"));
        if (p.images && p.images.length > 0) {
          formData.append("images", JSON.stringify(p.images));
        }
        if (p.clothImages && p.clothImages.length > 0) {
          formData.append("clothImages", JSON.stringify(p.clothImages));
        }
        if (p.styleTags && p.styleTags.length > 0) {
          formData.append("styleTags", JSON.stringify(p.styleTags));
        }

        const saved = await vendorApi.addProduct(formData);
        // Replace optimistic entry with server-confirmed product
        setState((prev) => ({
          ...prev,
          products: prev.products.map((x) => (x.id === p.id ? saved : x)),
        }));
        toast("Product synced to server", "success");
      } catch (err) {
        console.error("Failed to sync product to backend:", err);
        toast("Product saved locally", "info");
      }
    } else {
      toast("Product created (demo mode)", "success");
    }
  }, [toast]);

  const updateProduct = useCallback(async (id: string, patch: Partial<Product>) => {
    // 1. Optimistic: apply patch locally
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

    // 2. Sync to backend if authenticated
    if (hasAuthToken()) {
      try {
        const backendPatch: Record<string, unknown> = {};
        if (patch.name !== undefined) backendPatch.name = patch.name;
        if (patch.description !== undefined) backendPatch.description = patch.description;
        if (patch.sku !== undefined) backendPatch.sku = patch.sku;
        if (patch.price !== undefined) backendPatch.price = patch.price;
        if (patch.category !== undefined) backendPatch.category = patch.category;
        if (patch.stock !== undefined) backendPatch.stock = patch.stock;
        if (patch.bespoke !== undefined) backendPatch.requiresMeasurements = patch.bespoke;
        if (patch.status !== undefined) backendPatch.published = patch.status === "active";
        if (patch.images !== undefined) backendPatch.images = patch.images;
        if (patch.clothImages !== undefined) backendPatch.clothImages = patch.clothImages;
        if (patch.styleTags !== undefined) backendPatch.styleTags = patch.styleTags;

        await vendorApi.updateProduct(id, backendPatch as Partial<Product>);
        toast("Product updated", "success");
      } catch (err) {
        console.error("Failed to sync product update:", err);
        toast("Updated locally", "info");
      }
    } else {
      toast("Product updated (demo mode)", "success");
    }
  }, [toast]);

  const updateStock = useCallback(async (id: string, stock: number) => {
    const safeStock = Math.max(0, Math.round(stock));
    // 1. Optimistic: update stock locally (and derived sold-out status).
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id
          ? {
              ...p,
              stock: safeStock,
              status: safeStock === 0 && p.status === "active" ? "sold_out" : p.status,
            }
          : p,
      ),
    }));

    // 2. Sync to the dedicated stock endpoint if authenticated.
    if (hasAuthToken()) {
      try {
        await vendorApi.updateProductStock(id, safeStock);
      } catch (err) {
        console.error("Failed to sync stock update:", err);
        toast("Stock saved locally", "info");
      }
    }
  }, [toast]);

  const deleteProduct = useCallback(async (id: string) => {
    // 1. Optimistic: remove from local state
    const backup = state.products;
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));

    // 2. Sync to backend if authenticated
    if (hasAuthToken()) {
      try {
        await vendorApi.deleteProduct(id);
        toast("Product deleted", "success");
      } catch (err) {
        console.error("Failed to delete product:", err);
        // Revert on failure
        setState((prev) => ({ ...prev, products: backup }));
        toast("Delete failed — restored product", "error");
      }
    } else {
      toast("Product deleted (demo mode)", "success");
    }
  }, [toast, state.products]);

  const archiveProduct = useCallback(async (id: string) => {
    // 1. Optimistic: set status to archived locally
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id ? { ...p, status: "archived" as const } : p,
      ),
    }));

    // 2. Sync to backend if authenticated
    if (hasAuthToken()) {
      try {
        await vendorApi.updateProduct(id, { published: false } as unknown as Partial<Product>);
        toast("Product archived", "success");
      } catch (err) {
        console.error("Failed to archive product:", err);
        toast("Archived locally", "info");
      }
    } else {
      toast("Product archived (demo mode)", "success");
    }
  }, [toast]);

  /* ------------------------------------------------------------------ */
  /*  Order operations — optimistic local-first                          */
  /* ------------------------------------------------------------------ */

  const updateOrder = useCallback(async (id: string, patch: Partial<Order>) => {
    // 1. Optimistic: apply patch locally
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));

    // 2. Sync to backend if authenticated
    if (hasAuthToken()) {
      try {
        if (patch.status !== undefined) {
          await vendorApi.updateOrderStatus(id, patch.status);
        }
        if (patch.tracking !== undefined || patch.courier !== undefined) {
          await vendorApi.updateOrderTracking(id, patch.tracking || "", patch.courier || "");
        }
        toast("Order updated", "success");
      } catch (err) {
        console.error("Failed to sync order update:", err);
        toast("Updated locally", "info");
      }
    } else {
      toast("Order updated (demo mode)", "success");
    }
  }, [toast]);

  /* ------------------------------------------------------------------ */
  /*  Notification operations — local only                               */
  /* ------------------------------------------------------------------ */

  const addNotification = useCallback((n: Omit<AppNotification, "id">) => {
    setState((prev) => ({
      ...prev,
      notifications: [
        { ...n, id: `n-${Date.now()}` },
        ...prev.notifications,
      ],
    }));
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistic: mark all local notifications read immediately.
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));

    if (hasAuthToken()) {
      try {
        await vendorApi.markNotificationsRead();
      } catch (err) {
        console.error("Failed to sync notifications read state:", err);
      }
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Subscription — local only                                          */
  /* ------------------------------------------------------------------ */

  const setSubscription = useCallback((s: Subscription) => {
    setState((prev) => ({ ...prev, subscription: s }));
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Campaign operations — optimistic local-first                       */
  /* ------------------------------------------------------------------ */

  const addCampaign = useCallback(async (c: Campaign) => {
    // 1. Optimistic: add to local state. Token spend is handled by the caller
    //    via requestSpend (and by the backend on the real generation path), so
    //    we must not deduct again here or the vendor is double-charged.
    setState((prev) => ({
      ...prev,
      campaigns: [c, ...prev.campaigns],
    }));

    // 2. Sync to backend if authenticated
    if (hasAuthToken()) {
      try {
        const saved = await vendorApi.createCampaign({
          title: c.title,
          prompt: c.prompt,
          products: c.products,
          market: c.market,
          format: c.format,
        });
        // Replace optimistic entry with server-confirmed campaign
        setState((prev) => ({
          ...prev,
          campaigns: prev.campaigns.map((x) => (x.id === c.id ? saved : x)),
        }));
        toast("Campaign synced to server", "success");
      } catch (err) {
        console.error("Failed to sync campaign:", err);
        toast("Campaign saved locally", "info");
      }
    } else {
      toast("Campaign created (demo mode)", "success");
    }
  }, [toast]);

  const updateCampaign = useCallback((id: string, patch: Partial<Campaign>) => {
    setState((prev) => ({
      ...prev,
      campaigns: prev.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      campaigns: prev.campaigns.filter((c) => c.id !== id),
    }));
    toast("Campaign deleted.", "success");
  }, [toast]);

  /* ------------------------------------------------------------------ */
  /*  Backdrop — local only                                              */
  /* ------------------------------------------------------------------ */

  const addBackdrop = useCallback((b: Backdrop) => {
    setState((prev) => ({ ...prev, backdrops: [b, ...prev.backdrops] }));
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Storefront operations — optimistic local-first                     */
  /* ------------------------------------------------------------------ */

  const updateStorefront = useCallback(
    async (patch: Partial<StorefrontSettings>) => {
      // 1. Optimistic: apply patch locally
      setState((prev) => ({
        ...prev,
        storefront: { ...prev.storefront, ...patch },
      }));

      // 2. Sync to backend if authenticated
      if (hasAuthToken()) {
        try {
          const backendPatch: Record<string, unknown> = {};
          if (patch.businessName !== undefined) backendPatch.businessName = patch.businessName;
          if (patch.logo !== undefined) backendPatch.logo = patch.logo;
          if (patch.cover !== undefined) backendPatch.cover = patch.cover;
          if (patch.bio !== undefined) backendPatch.bio = patch.bio;

          await vendorApi.updateStorefront(backendPatch as Partial<StorefrontSettings>);
          toast("Storefront settings saved", "success");
        } catch (err) {
          console.error("Failed to sync storefront:", err);
          toast("Saved locally", "info");
        }
      } else {
        toast("Storefront updated (demo mode)", "success");
      }
    },
    [toast],
  );

  /* ------------------------------------------------------------------ */
  /*  Token usage tracking — local only                                  */
  /* ------------------------------------------------------------------ */

  const recordUsage = useCallback((feature: string, tokens: number) => {
    setState((prev) => {
      const existing = prev.tokenUsage.find((u) => u.feature === feature);
      const tokenUsage = existing
        ? prev.tokenUsage.map((u) =>
            u.feature === feature
              ? { ...u, calls: u.calls + 1, tokens: u.tokens + tokens }
              : u,
          )
        : [
            ...prev.tokenUsage,
            { feature, calls: 1, tokens },
          ];
      return { ...prev, tokenUsage };
    });
  }, []);

  const value: VendorContextValue = {
    ...state,
    addTokens,
    spendTokens,
    requestSpend,
    paywall,
    closePaywall,
    toasts,
    toast,
    dismissToast,
    addProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    archiveProduct,
    updateOrder,
    addNotification,
    markAllRead,
    setSubscription,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    addBackdrop,
    updateStorefront,
    recordUsage,
    addTopUp,
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
      <TokenPaywallBridge
        paywall={paywall}
        currentTokens={state.tokens}
        closePaywall={closePaywall}
        buyAndProceed={buyAndProceed}
      />
      <ToastViewport toasts={toasts} dismiss={dismissToast} />
    </VendorContext.Provider>
  );
}

// Imported lazily to avoid a circular import at module top.
import { TokenPaywallBridge } from "@/components/vendor/TokenPaywall";
import { ToastViewport } from "@/components/vendor/Toast";

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error("useVendor must be used within VendorProvider");
  return ctx;
}
