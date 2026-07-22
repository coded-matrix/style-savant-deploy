import { pgTable, text, timestamp, uuid, integer, decimal, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "vendor", "admin"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "completed", "cancelled", "confirmed", "packed", "shipped", "delivered"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "expired", "cancelled"]);
export const tokenTransactionTypeEnum = pgEnum("token_transaction_type", ["purchase", "usage", "refund"]);
export const aiFeatureTypeEnum = pgEnum("ai_feature_type", ["inventory_analysis", "background_removal", "demand_forecast"]);
export const notificationCategoryEnum = pgEnum("notification_category", ["orders", "stock", "tokens", "payouts", "system"]);
export const paymentPurposeEnum = pgEnum("payment_purpose", ["subscription", "tokens"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed"]);
export const videoRequestStatusEnum = pgEnum("video_request_status", ["pending", "accepted", "in_progress", "delivered", "rejected"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("customer"),
  avatar: text("avatar"),
  fitPhoto: text("fit_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  description: text("description"),
  logo: text("logo"),
  cover: text("cover"),
  verified: boolean("verified").default(false).notNull(),
  productsCount: integer("products_count").default(0).notNull(),
  looksCount: integer("looks_count").default(0).notNull(),
  memberSince: text("member_since"),
  category: text("category"),
  bio: text("bio"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  website: text("website"),
  // WhatsApp-first commerce: orders are handed off to the business over
  // WhatsApp, so every vendor registers contact numbers up front.
  businessCallNumber: text("business_call_number"),
  businessWhatsapp: text("business_whatsapp"),
  shippingPolicy: text("shipping_policy"),
  tags: text("tags").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  images: text("images").array().default([]).notNull(),
  // Cloth-only (garment laid flat / on hanger) images, paired by index with
  // `images`. Used exclusively by the AI virtual try-on; never shown in browsing.
  clothImages: text("cloth_images").array().default([]).notNull(),
  sizes: text("sizes").array().default([]).notNull(),
  colors: jsonb("colors").default([]).notNull(),
  deliveryInfo: text("delivery_info"),
  returnPolicy: text("return_policy"),
  artLinkedArtistId: text("art_linked_artist_id"),
  soldOut: boolean("sold_out").default(false).notNull(),
  stockBySize: jsonb("stock_by_size").default({}).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("4.5").notNull(),
  communityLookIds: text("community_look_ids").array().default([]).notNull(),
  stock: integer("stock").default(0).notNull(),
  requiresMeasurements: boolean("requires_measurements").default(false).notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Body Measurements table
/**
 * Tailor-grade body measurements. Everything is stored in INCHES — the UI
 * offers a cm toggle for display, but persistence is single-unit so no
 * conversion ambiguity can creep in.
 *
 * One row per user: writes upsert on userId rather than appending, so a
 * measurement can actually be corrected.
 */
export const bodyMeasurements = pgTable("body_measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),

  // ── Upper body ──
  chestInches: decimal("chest_inches", { precision: 5, scale: 2 }),
  bustInches: decimal("bust_inches", { precision: 5, scale: 2 }),
  underbustInches: decimal("underbust_inches", { precision: 5, scale: 2 }),
  shoulderWidthInches: decimal("shoulder_width_inches", { precision: 5, scale: 2 }),
  neckInches: decimal("neck_inches", { precision: 5, scale: 2 }),
  sleeveLengthInches: decimal("sleeve_length_inches", { precision: 5, scale: 2 }),
  bicepInches: decimal("bicep_inches", { precision: 5, scale: 2 }),
  wristInches: decimal("wrist_inches", { precision: 5, scale: 2 }),
  backLengthInches: decimal("back_length_inches", { precision: 5, scale: 2 }),

  // ── Lower body ──
  waistInches: decimal("waist_inches", { precision: 5, scale: 2 }),
  hipsInches: decimal("hips_inches", { precision: 5, scale: 2 }),
  thighInches: decimal("thigh_inches", { precision: 5, scale: 2 }),
  kneeInches: decimal("knee_inches", { precision: 5, scale: 2 }),
  calfInches: decimal("calf_inches", { precision: 5, scale: 2 }),
  inseamInches: decimal("inseam_inches", { precision: 5, scale: 2 }),
  outseamInches: decimal("outseam_inches", { precision: 5, scale: 2 }),

  // ── Full length ──
  heightInches: decimal("height_inches", { precision: 5, scale: 2 }),

  // Free-text notes a tailor should see (e.g. "prefers loose sleeves").
  notes: text("notes"),
  recommendedSize: text("recommended_size"),
  confidencePercent: integer("confidence_percent"),
  rawLandmarks: jsonb("raw_landmarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  shippingAddress: jsonb("shipping_address"),
  measurementId: uuid("measurement_id").references(() => bodyMeasurements.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Token Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  tokensTotal: integer("tokens_total").notNull(),
  tokensUsed: integer("tokens_used").default(0).notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expires_at"),
  paymentReference: text("payment_reference"),
  // Billing: every vendor starts with a free trial month; afterwards the plan
  // is a flat monthly fee paid manually via Hubtel mobile money.
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Hubtel mobile-money payments ledger (subscription fees & token bundles).
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  purpose: paymentPurposeEnum("purpose").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  // Tokens granted when this payment settles (monthly allocation or bundle size).
  tokensGranted: integer("tokens_granted").default(0).notNull(),
  clientReference: text("client_reference").notNull().unique(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  checkoutUrl: text("checkout_url"),
  hubtelTransactionId: text("hubtel_transaction_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI video campaign requests: a vendor (business) asks the platform admin to
// produce an AI video for them (replaces the old AI image campaigns).
export const videoRequests = pgTable("video_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  // The user account that submitted the request (the vendor's login user).
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // The requesting business.
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  // Campaign concept title, e.g. "Sunset beach editorial".
  conceptTitle: text("concept_title"),
  // The creative brief: concept ideas, mood, audience, references.
  brief: text("brief").notNull(),
  // Optional reference image (product shot, mood board frame).
  referenceImageUrl: text("reference_image_url"),
  status: videoRequestStatusEnum("status").notNull().default("pending"),
  // Set by the admin when accepting: when the vendor should expect the video.
  expectedDeliveryAt: timestamp("expected_delivery_at"),
  // Set by the admin when the AI video is ready (uploaded via /api/uploads).
  videoUrl: text("video_url"),
  vendorNote: text("vendor_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Token Transactions table
export const tokenTransactions = pgTable("token_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  type: tokenTransactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  balance: integer("balance").notNull(),
  description: text("description"),
  reference: text("reference"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Usage Log table
export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  featureType: aiFeatureTypeEnum("feature_type").notNull(),
  tokensCost: integer("tokens_cost").notNull(),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  success: boolean("success").default(true).notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventory Analysis table
export const inventoryAnalyses = pgTable("inventory_analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  analysisType: text("analysis_type").notNull(), // 'demand_forecast', 'restock_alert', 'overstock_flag'
  currentStock: integer("current_stock"),
  forecastedDemand: integer("forecasted_demand"),
  suggestedRestockQty: integer("suggested_restock_qty"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  seasonalContext: jsonb("seasonal_context"),
  salesPattern: jsonb("sales_pattern"),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sales History table (for AI analysis)
export const salesHistory = pgTable("sales_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantitySold: integer("quantity_sold").notNull(),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull(),
  saleDate: timestamp("sale_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [users.id],
    references: [vendors.userId],
  }),
  orders: many(orders),
  measurements: many(bodyMeasurements),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, {
    fields: [vendors.userId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
  subscriptions: many(subscriptions),
  campaigns: many(campaigns),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  vendor: one(vendors, {
    fields: [orders.vendorId],
    references: [vendors.id],
  }),
  measurement: one(bodyMeasurements, {
    fields: [orders.measurementId],
    references: [bodyMeasurements.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const bodyMeasurementsRelations = relations(bodyMeasurements, ({ one, many }) => ({
  user: one(users, {
    fields: [bodyMeasurements.userId],
    references: [users.id],
  }),
  orders: many(orders),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  vendor: one(vendors, {
    fields: [subscriptions.vendorId],
    references: [vendors.id],
  }),
}));

export const tokenTransactionsRelations = relations(tokenTransactions, ({ one }) => ({
  vendor: one(vendors, {
    fields: [tokenTransactions.vendorId],
    references: [vendors.id],
  }),
}));

export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  vendor: one(vendors, {
    fields: [aiUsageLogs.vendorId],
    references: [vendors.id],
  }),
}));

export const inventoryAnalysesRelations = relations(inventoryAnalyses, ({ one }) => ({
  vendor: one(vendors, {
    fields: [inventoryAnalyses.vendorId],
    references: [vendors.id],
  }),
  product: one(products, {
    fields: [inventoryAnalyses.productId],
    references: [products.id],
  }),
}));

export const salesHistoryRelations = relations(salesHistory, ({ one }) => ({
  vendor: one(vendors, {
    fields: [salesHistory.vendorId],
    references: [vendors.id],
  }),
  product: one(products, {
    fields: [salesHistory.productId],
    references: [products.id],
  }),
}));

// Art Styles table
export const artStyles = pgTable("art_styles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Preset Models table
export const presetModels = pgTable("preset_models", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  thumb: text("thumb").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Artists table
export const artists = pgTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  portrait: text("portrait").notNull(),
  bio: text("bio").notNull(),
  location: text("location").notNull(),
  backdropsCount: integer("backdrops_count").default(0).notNull(),
  tagline: text("tagline"),
  followersCount: text("followers_count"),
  originalWorks: jsonb("original_works").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Backdrops table
export const backdrops = pgTable("backdrops", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  artistId: text("artist_id").references(() => artists.id, { onDelete: "set null" }),
  artistName: text("artist_name").notNull(),
  image: text("image").notNull(),
  premium: boolean("premium").default(false).notNull(),
  priceGHS: decimal("price_ghs", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Looks table
export const looks = pgTable("looks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  avatar: text("avatar").notNull(),
  image: text("image").notNull(),
  // Optional motion media for the timeline. `image` remains the required
  // poster/fallback so existing looks and non-video clients keep working.
  videoUrl: text("video_url"),
  caption: text("caption").notNull(),
  votes: integer("votes").default(0).notNull(),
  leadProductId: text("lead_product_id").notNull(),
  productIds: text("product_ids").array().default([]).notNull(),
  backdropId: text("backdrop_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Try-on Gallery — stores AI-generated try-on images so users can review
// and revisit past fits. Images are stored as base64 text (portrait aspect,
// typically 50-300 KB after encoding). A dedicated PurgeCSS / S3 migration
// can move them out-of-band later.
export const tryonGallery = pgTable("tryon_gallery", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  imageBase64: text("image_base64").notNull(),
  // SHA-256 of the fit photo used to generate this look — lets us return a
  // cached result when the same user + product + photo comes around again.
  fitPhotoHash: text("fit_photo_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  caption: text("caption").notNull(),
  hashtags: text("hashtags").array().default([]).notNull(),
  image: text("image").notNull(),
  products: text("products").array().default([]).notNull(),
  prompt: text("prompt").notNull(),
  market: text("market").notNull(),
  format: text("format").notNull(),
  tokens: integer("tokens").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  vendor: one(vendors, {
    fields: [campaigns.vendorId],
    references: [vendors.id],
  }),
}));

// Notifications table — vendor-facing alerts (new orders, low stock, token/payout events)
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  category: notificationCategoryEnum("category").notNull(),
  text: text("text").notNull(),
  link: text("link"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  vendor: one(vendors, {
    fields: [notifications.vendorId],
    references: [vendors.id],
  }),
}));
