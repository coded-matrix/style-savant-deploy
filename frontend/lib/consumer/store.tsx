"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Address,
  ArtStyle,
  Artist,
  Backdrop,
  CartItem,
  Look,
  Order,
  PresetModel,
  Product,
  Size,
  Toast,
  ToastTone,
  User,
  Vendor,
} from "./types";
import { isFashionCategory } from "./types";
import {
  clearConsumerToken,
  getConsumerToken,
  __isBrowser,
  __LEGACY_SESSION_KEY,
} from "@/lib/api/token";
import { authApi } from "@/lib/api/auth";
import { catalogApi } from "@/lib/api/catalog";

const GUEST_AVATAR =
  "https://picsum.photos/seed/savant-guest/120/120";

interface AppState {
  // session
  user: User;
  vendorId: string | null;
  isReturning: boolean;
  authReady: boolean;
  setUser: (u: Partial<User>) => void;
  logout: () => void;
  markReturning: () => void;

  // onboarding scratch
  onboarding: {
    username: string;
    usernameValid: "idle" | "checking" | "valid" | "taken" | "invalid";
    artStyleIds: string[];
    backdropId: string;
  };
  setOnboarding: (patch: Partial<AppState["onboarding"]>) => void;

  // catalog helpers
  artStyles: ArtStyle[];
  presetModels: PresetModel[];
  products: Product[];
  looks: Look[];
  allBackdrops: Backdrop[];
  freeBackdrops: Backdrop[];
  premiumBackdrops: Backdrop[];
  artists: Artist[];
  vendors: Vendor[];

  productById: (id: string) => Product | undefined;
  vendorById: (id: string) => Vendor | undefined;
  artistById: (id: string) => Artist | undefined;
  backdropById: (id: string) => Backdrop | undefined;
  productsByVendor: (vendorId: string) => Product[];
  backdropsByArtist: (artistId: string) => Backdrop[];

  // likes
  likedProductIds: string[];
  toggleLikeProduct: (id: string) => void;

  // cart
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, size: Size, color?: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  removeFromCart: (lineId: string) => void;
  clearCart: () => void;

  // saved looks (own)
  savedLooks: Look[];
  saveLook: (look: Look) => void;
  deleteSavedLook: (id: string) => void;
  postLook: (look: Look) => void;

  // backdrops owned
  ownedBackdropIds: string[];
  purchaseBackdrop: (id: string) => void;
  activeBackdropId: string;
  setActiveBackdropId: (id: string) => void;

  // orders
  orders: Order[];
  createOrder: (address: Address, paymentMethod: string) => Order;

  // votes
  votedLookIds: string[];
  toggleVote: (id: string) => void;

  // measurement
  measurementId: string | null;
  recommendedSize: Record<string, string>; // productId → recommended size
  setMeasurementId: (id: string | null) => void;
  setRecommendedSize: (productId: string, size: string) => void;

  // virtual try-on — kept in the store (which lives above the router) so an
  // in-progress render survives the user navigating away from the Studio.
  tryOn: {
    status: "idle" | "rendering" | "done" | "error";
    image: string | null; // data URI of the finished result
    productId: string | null;
  };
  tryOnJustCompleted: boolean; // set when a render finishes; drives the resume-button animation
  runTryOn: (productId: string, garmentUrl?: string) => Promise<{ galleryId?: string; cached?: boolean }>;
  hydrateTryOn: (image: string | null) => void; // restore a saved result after a full reload
  clearTryOn: () => void;
  ackTryOn: () => void; // mark the finished render as seen

  // toasts
  toasts: Toast[];
  toast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
}

const Ctx = createContext<AppState | null>(null);

const INITIAL_USER: User = {
  username: "Guest",
  avatar: GUEST_AVATAR,
  isGuest: true,
  artStyleIds: [],
  backdropIds: ["b1"],
  looksPosted: 0,
  votesReceived: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User>(INITIAL_USER);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [onboarding, setOnboardingState] = useState<AppState["onboarding"]>({
    username: "",
    usernameValid: "idle",
    artStyleIds: [],
    backdropId: "b1",
  });

  const [likedProductIds, setLiked] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedLooks, setSavedLooks] = useState<Look[]>([]);
  const [ownedBackdropIds, setOwnedBackdropIds] = useState<string[]>(["b1", "b2", "b3", "b4"]);
  const [activeBackdropId, setActiveBackdropId] = useState<string>("b1");
  const [orders, setOrders] = useState<Order[]>([]);
  const [votedLookIds, setVotedLookIds] = useState<string[]>([]);
  const [measurementId, setMeasurementId] = useState<string | null>(null);
  const [recommendedSize, setRecommendedSizeState] = useState<Record<string, string>>({});
  
  const [artStyles, setArtStyles] = useState<ArtStyle[]>([]);
  const [presetModels, setPresetModels] = useState<PresetModel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [looks, setLooks] = useState<Look[]>([]);
  const [allBackdrops, setAllBackdrops] = useState<Backdrop[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  // restore session + cold-load migration sweep
  useEffect(() => {
    if (!__isBrowser) {
      setAuthReady(true);
      return;
    }

    let cancelled = false;

    // Migration sweep (review item #2): if a legacy pre-merge `ss-session`
    // blob exists but no JWT, drop the legacy blob so it cannot resurrect a
    // fake "logged in" user state.
    if (!getConsumerToken()) {
      try {
        localStorage.removeItem(__LEGACY_SESSION_KEY);
      } catch {
        // ignore
      }
    }

    // Hydrate non-auth UI state from the new (post-sweep) session blob.
    try {
      const raw = localStorage.getItem(__LEGACY_SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.user) setUserState(s.user);
        if (s.isReturning) setIsReturning(true);
        if (s.likedProductIds) setLiked(s.likedProductIds);
        if (s.cart) setCart(s.cart);
        if (s.ownedBackdropIds) setOwnedBackdropIds(s.ownedBackdropIds);
        if (s.activeBackdropId) setActiveBackdropId(s.activeBackdropId);
        if (s.votedLookIds) setVotedLookIds(s.votedLookIds);
      }
    } catch {
      // ignore
    }

    // Rehydrate the authenticated user from the JWT via the backend.
    const token = getConsumerToken();
    if (token) {
      // Mark as returning IMMEDIATELY so the splash can route without
      // waiting for the backend round-trip. The /me call below only
      // enriches the user record; routing doesn't depend on it.
      setIsReturning(true);
      authApi
        .me()
        .then((data) => {
          if (cancelled) return;
          setUserState((prev) => ({
            ...prev,
            isGuest: false,
            username: data.user.name,
            avatar: data.user.avatar ? `data:image/jpeg;base64,${data.user.avatar}` : prev.avatar,
            fitProfile: {
              ...prev.fitProfile,
              photo: data.user.fitPhoto ? `data:image/jpeg;base64,${data.user.fitPhoto}` : prev.fitProfile?.photo,
            },
          }));
          setVendorId(data.vendor?.id ?? null);
        })
        .catch(() => {
          if (cancelled) return;
          // /me failed — token is bad. Clear it but keep isReturning since
          // the user was at least signed in recently; let the splash route
          // to feed so they can recover there.
          clearConsumerToken();
        })
        .finally(() => {
          if (!cancelled) setAuthReady(true);
        });
    } else {
      setAuthReady(true);
    }

    // Fetch all catalog info
    Promise.all([
      catalogApi.getArtStyles(),
      catalogApi.getPresetModels(),
      catalogApi.getProducts(),
      catalogApi.getLooks(),
      catalogApi.getBackdrops(),
      catalogApi.getArtists(),
      catalogApi.getVendors(),
    ])
      .then(([styles, presets, prods, lks, bds, arts, vnds]) => {
        if (cancelled) return;
        setArtStyles(styles);
        setPresetModels(presets);
        // The database still contains historical non-fashion records. Keep
        // them out of feed, explore, rank, search and vendor storefronts.
        setProducts(prods.filter((product) => isFashionCategory(product.category)));
        setLooks(lks);
        setAllBackdrops(bds);
        setArtists(arts);
        setVendors(vnds);
      })
      .catch((err) => {
        console.error("Failed to load catalog data", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // persist session (debounced via ref)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!__isBrowser) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          __LEGACY_SESSION_KEY,
          JSON.stringify({
            user,
            isReturning,
            likedProductIds,
            cart,
            ownedBackdropIds,
            activeBackdropId,
            votedLookIds,
          }),
        );
      } catch {
        // ignore
      }
    }, 300);
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        try {
          localStorage.setItem(
            __LEGACY_SESSION_KEY,
            JSON.stringify({
              user,
              isReturning,
              likedProductIds,
              cart,
              ownedBackdropIds,
              activeBackdropId,
              votedLookIds,
            }),
          );
        } catch {
          // ignore
        }
      }
    };
  }, [user, isReturning, likedProductIds, cart, ownedBackdropIds, activeBackdropId, votedLookIds]);

  const setUser = useCallback((u: Partial<User>) => {
    setUserState((prev) => ({ ...prev, ...u }));
  }, []);

  const logout = useCallback(() => {
    clearConsumerToken();
    try {
      localStorage.removeItem(__LEGACY_SESSION_KEY);
    } catch {
      // ignore
    }
    setUserState(INITIAL_USER);
    setVendorId(null);
    setIsReturning(false);
    setLiked([]);
    setCart([]);
    setSavedLooks([]);
    setVotedLookIds([]);
    setActiveBackdropId("b1");
    setOwnedBackdropIds(["b1", "b2", "b3", "b4"]);
  }, []);

  const markReturning = useCallback(() => setIsReturning(true), []);

  const setOnboarding = useCallback((patch: Partial<AppState["onboarding"]>) => {
    setOnboardingState((prev) => ({ ...prev, ...patch }));
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "neutral") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }, []);
  const dismissToast = useCallback(
    (id: string) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  // ── virtual try-on (survives navigation away from Studio) ──────────────
  const [tryOn, setTryOn] = useState<AppState["tryOn"]>({
    status: "idle",
    image: null,
    productId: null,
  });
  const [tryOnJustCompleted, setTryOnJustCompleted] = useState(false);

  const runTryOn = useCallback(
    async (productId: string, garmentUrl?: string) => {
      setTryOn({ status: "rendering", image: null, productId });
      setTryOnJustCompleted(false);
      try {
        const res = await catalogApi.tryOnProduct(productId, garmentUrl);
        setTryOn({ status: "done", image: `data:image/jpeg;base64,${res.image}`, productId });
        setTryOnJustCompleted(true);
        toast("Your try-on is ready!", "success");
        return res;
      } catch (err) {
        setTryOn({ status: "error", image: null, productId });
        const message = err instanceof Error ? err.message : "Unknown error";
        toast(`Try-on failed: ${message}`, "error");
        throw err;
      }
    },
    [toast],
  );

  const hydrateTryOn = useCallback((image: string | null) => {
    if (!image) return;
    // Only restore into an idle store — never clobber an in-flight render.
    setTryOn((prev) =>
      prev.status === "idle" ? { status: "done", image, productId: null } : prev,
    );
  }, []);

  const clearTryOn = useCallback(() => {
    setTryOn({ status: "idle", image: null, productId: null });
    setTryOnJustCompleted(false);
  }, []);

  const ackTryOn = useCallback(() => setTryOnJustCompleted(false), []);

  const toggleLikeProduct = useCallback((id: string) => {
    setLiked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const addToCart = useCallback(
    (productId: string, size: Size, color?: string) => {
      const lineId = `${productId}-${size}-${color ?? "x"}`;
      setCart((prev) => {
        const existing = prev.find((c) => c.id === lineId);
        if (existing) {
          return prev.map((c) => (c.id === lineId ? { ...c, qty: c.qty + 1 } : c));
        }
        return [...prev, { id: lineId, productId, size, color, qty: 1 }];
      });
    },
    []
  );
  const updateQty = useCallback((lineId: string, qty: number) => {
    setCart((prev) =>
      prev.map((c) => (c.id === lineId ? { ...c, qty: Math.max(1, qty) } : c))
    );
  }, []);
  const removeFromCart = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== lineId));
  }, []);
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = useMemo(() => cart.reduce((n, c) => n + c.qty, 0), [cart]);
  const cartSubtotal = useMemo(
    () =>
      cart.reduce((sum, c) => {
        const p = products.find((pr) => pr.id === c.productId);
        return sum + (p ? p.priceGHS * c.qty : 0);
      }, 0),
    [cart, products]
  );

  const saveLook = useCallback((look: Look) => {
    setSavedLooks((prev) => [look, ...prev.filter((l) => l.id !== look.id)]);
  }, []);
  const deleteSavedLook = useCallback((id: string) => {
    setSavedLooks((prev) => prev.filter((l) => l.id !== id));
  }, []);
  const postLook = useCallback(
    (look: Look) => {
      setLooks((prev) => [{ ...look, isMine: true }, ...prev]);
      setUserState((prev) => ({ ...prev, looksPosted: prev.looksPosted + 1 }));
    },
    []
  );

  const purchaseBackdrop = useCallback((id: string) => {
    setOwnedBackdropIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const toggleVote = useCallback((id: string) => {
    setVotedLookIds((prev) => {
      const has = prev.includes(id);
      setLooks((ls) =>
        ls.map((l) =>
          l.id === id
            ? { ...l, votes: Math.max(0, l.votes + (has ? -1 : 1)), votedByMe: !has }
            : l
        )
      );
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, []);

  const productById = useCallback((id: string) => products.find((p) => p.id === id), [products]);
  const vendorById = useCallback((id: string) => vendors.find((v) => v.id === id), [vendors]);
  const artistById = useCallback((id: string) => artists.find((a) => a.id === id), [artists]);
  const backdropById = useCallback((id: string) => allBackdrops.find((b) => b.id === id), [allBackdrops]);
  const productsByVendor = useCallback((vendorId: string) => products.filter((p) => p.vendorId === vendorId), [products]);
  const backdropsByArtist = useCallback((artistId: string) => allBackdrops.filter((b) => b.artistId === artistId), [allBackdrops]);

  const createOrder = useCallback(
    (address: Address, paymentMethod: string): Order => {
      const items = cart;
      const total = cart.reduce((sum, c) => {
        const p = productById(c.productId);
        return sum + (p ? p.priceGHS * c.qty : 0);
      }, 0);
      const digitalBackdrop = items.some((c) => productById(c.productId)?.category === "Art");
      const order: Order = {
        id: Math.random().toString(36).slice(2),
        number: `#SS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        items,
        totalGHS: total,
        address,
        paymentMethod,
        estimatedDelivery: "2-5 business days",
        hasDigitalBackdrop: digitalBackdrop,
      };
      setOrders((prev) => [order, ...prev]);
      // if digital backdrop purchased, unlock b8
      if (digitalBackdrop) setOwnedBackdropIds((prev) => [...prev, "b8"]);
      setCart([]);
      return order;
    },
    [cart, products, allBackdrops, productById]
  );

  const value: AppState = {
    user,
    vendorId,
    isReturning,
    authReady,
    setUser,
    logout,
    markReturning,
    onboarding,
    setOnboarding,
    artStyles,
    presetModels,
    products,
    looks,
    allBackdrops,
    freeBackdrops: allBackdrops.filter((b) => !b.premium),
    premiumBackdrops: allBackdrops.filter((b) => b.premium),
    artists,
    vendors,
    productById,
    vendorById,
    artistById,
    backdropById,
    productsByVendor,
    backdropsByArtist,
    likedProductIds,
    toggleLikeProduct,
    cart,
    cartCount,
    cartSubtotal,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    savedLooks,
    saveLook,
    deleteSavedLook,
    postLook,
    ownedBackdropIds,
    purchaseBackdrop,
    activeBackdropId,
    setActiveBackdropId,
    orders,
    createOrder,
    votedLookIds,
    toggleVote,
    measurementId,
    setMeasurementId,
    recommendedSize,
    setRecommendedSize: (productId: string, size: string) => setRecommendedSizeState(prev => ({ ...prev, [productId]: size })),
    tryOn,
    tryOnJustCompleted,
    runTryOn,
    hydrateTryOn,
    clearTryOn,
    ackTryOn,
    toasts,
    toast,
    dismissToast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// SSR-safe default state. Returned by useApp() when no AppProvider is mounted
// (e.g. during Next.js static prerender for pages outside /savant). Pages that
// mount inside AppProvider receive the live store and full functionality.
const NOOP = () => undefined;
const SSR_DEFAULT_STATE: AppState = {
  user: INITIAL_USER,
  vendorId: null,
  isReturning: false,
  authReady: false,
  setUser: NOOP,
  logout: NOOP,
  markReturning: NOOP,
  onboarding: {
    username: "",
    usernameValid: "idle",
    artStyleIds: [],
    backdropId: "b1",
  },
  setOnboarding: NOOP,
  artStyles: [],
  presetModels: [],
  products: [],
  looks: [],
  allBackdrops: [],
  freeBackdrops: [],
  premiumBackdrops: [],
  artists: [],
  vendors: [],
  productById: () => undefined,
  vendorById: () => undefined,
  artistById: () => undefined,
  backdropById: () => undefined,
  productsByVendor: () => [],
  backdropsByArtist: () => [],
  likedProductIds: [],
  toggleLikeProduct: NOOP,
  cart: [],
  cartCount: 0,
  cartSubtotal: 0,
  addToCart: NOOP,
  updateQty: NOOP,
  removeFromCart: NOOP,
  clearCart: NOOP,
  savedLooks: [],
  saveLook: NOOP,
  deleteSavedLook: NOOP,
  postLook: NOOP,
  ownedBackdropIds: [],
  purchaseBackdrop: NOOP,
  activeBackdropId: "b1",
  setActiveBackdropId: NOOP,
  orders: [],
  createOrder: () => ({
    id: "",
    number: "",
    items: [],
    totalGHS: 0,
    address: { name: "", phone: "", line1: "", city: "", region: "" },
    paymentMethod: "",
    estimatedDelivery: "",
    hasDigitalBackdrop: false,
  }),
  votedLookIds: [],
  toggleVote: NOOP,
  measurementId: null,
  recommendedSize: {},
  setMeasurementId: NOOP,
  setRecommendedSize: NOOP,
  tryOn: { status: "idle", image: null, productId: null },
  tryOnJustCompleted: false,
  runTryOn: async () => ({}),
  hydrateTryOn: NOOP,
  clearTryOn: NOOP,
  ackTryOn: NOOP,
  toasts: [],
  toast: NOOP,
  dismissToast: NOOP,
};

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  return ctx ?? SSR_DEFAULT_STATE;
}
