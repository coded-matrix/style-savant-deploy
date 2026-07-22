import { pgTable, text, timestamp, uuid, integer, decimal, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "vendor", "admin"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "completed", "cancelled"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "expired", "cancelled"]);
export const tokenTransactionTypeEnum = pgEnum("token_transaction_type", ["purchase", "usage", "refund"]);
export const aiFeatureTypeEnum = pgEnum("ai_feature_type", ["inventory_analysis", "background_removal", "demand_forecast"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("customer"),
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
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  images: text("images").array().default([]).notNull(),
  stock: integer("stock").default(0).notNull(),
  requiresMeasurements: boolean("requires_measurements").default(false).notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Body Measurements table
export const bodyMeasurements = pgTable("body_measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chestInches: decimal("chest_inches", { precision: 5, scale: 2 }),
  waistInches: decimal("waist_inches", { precision: 5, scale: 2 }),
  hipsInches: decimal("hips_inches", { precision: 5, scale: 2 }),
  inseamInches: decimal("inseam_inches", { precision: 5, scale: 2 }),
  sleeveLengthInches: decimal("sleeve_length_inches", { precision: 5, scale: 2 }),
  heightInches: decimal("height_inches", { precision: 5, scale: 2 }),
  recommendedSize: text("recommended_size"),
  confidencePercent: integer("confidence_percent"),
  rawLandmarks: jsonb("raw_landmarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
