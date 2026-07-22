import type Database from "better-sqlite3";

const DEMO_VENDOR_ID = "demo-vendor-123";
const DEMO_PRODUCT_ID = "demo-product-123";
const DEMO_USER_ID = "11111111-1111-1111-1111-111111111111";

export function initSqliteDatabase(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT NOT NULL,
      category TEXT NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      stock INTEGER NOT NULL DEFAULT 0,
      requires_measurements INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chest_inches TEXT,
      waist_inches TEXT,
      hips_inches TEXT,
      inseam_inches TEXT,
      sleeve_length_inches TEXT,
      height_inches TEXT,
      recommended_size TEXT,
      confidence_percent INTEGER,
      raw_landmarks TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      total_amount TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_reference TEXT,
      shipping_address TEXT,
      measurement_id TEXT REFERENCES body_measurements(id),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      tokens_total INTEGER NOT NULL,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at INTEGER,
      payment_reference TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS token_transactions (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance INTEGER NOT NULL,
      description TEXT,
      reference TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      feature_type TEXT NOT NULL,
      tokens_cost INTEGER NOT NULL,
      input_data TEXT,
      output_data TEXT,
      success INTEGER NOT NULL DEFAULT 1,
      error_message TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS inventory_analyses (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      analysis_type TEXT NOT NULL,
      current_stock INTEGER,
      forecasted_demand INTEGER,
      suggested_restock_qty INTEGER,
      confidence TEXT,
      seasonal_context TEXT,
      sales_pattern TEXT,
      recommendations TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS sales_history (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity_sold INTEGER NOT NULL,
      revenue TEXT NOT NULL,
      sale_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  seedDemoData(sqlite);
}

function seedDemoData(sqlite: Database.Database) {
  const seed = sqlite.transaction(() => {
    const vendorExists = sqlite
      .prepare("SELECT id FROM vendors WHERE id = ?")
      .get(DEMO_VENDOR_ID);

    if (vendorExists) return;

    const now = Math.floor(Date.now() / 1000);
    const monthAgo = now - 30 * 24 * 60 * 60;

    sqlite
      .prepare(
        `INSERT INTO users (id, email, password, name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        DEMO_USER_ID,
        "vendor@example.com",
        "demo",
        "Demo Vendor",
        "vendor",
        now,
        now
      );

    sqlite
      .prepare(
        `INSERT INTO vendors (id, user_id, business_name, description, verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        DEMO_VENDOR_ID,
        DEMO_USER_ID,
        "CODED Demo Fashion",
        "Demo vendor for local testing",
        1,
        now,
        now
      );

    const products = [
      {
        id: DEMO_PRODUCT_ID,
        name: "Kente Print Dress",
        category: "Dresses",
        price: "250.00",
        stock: 8,
      },
      {
        id: "demo-product-456",
        name: "Ankara Blazer",
        category: "Outerwear",
        price: "320.00",
        stock: 3,
      },
      {
        id: "demo-product-789",
        name: "Wax Print Skirt",
        category: "Skirts",
        price: "180.00",
        stock: 45,
      },
    ];

    const insertProduct = sqlite.prepare(
      `INSERT INTO products (id, vendor_id, name, description, price, category, stock, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    );

    for (const product of products) {
      insertProduct.run(
        product.id,
        DEMO_VENDOR_ID,
        product.name,
        `${product.name} - demo inventory item`,
        product.price,
        product.category,
        product.stock,
        now,
        now
      );
    }

    sqlite
      .prepare(
        `INSERT INTO subscriptions (id, vendor_id, tokens_total, tokens_used, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "demo-subscription-123",
        DEMO_VENDOR_ID,
        5000,
        850,
        "active",
        now,
        now
      );

    sqlite
      .prepare(
        `INSERT INTO token_transactions (id, vendor_id, type, amount, balance, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "demo-txn-1",
        DEMO_VENDOR_ID,
        "purchase",
        5000,
        5000,
        "Initial demo token purchase",
        now
      );

    const insertSale = sqlite.prepare(
      `INSERT INTO sales_history (id, vendor_id, product_id, quantity_sold, revenue, sale_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const salesData: [number, string, number][] = [
      [12, "3000.00", monthAgo + 5 * 24 * 60 * 60],
      [18, "4500.00", monthAgo + 12 * 24 * 60 * 60],
      [15, "3750.00", monthAgo + 20 * 24 * 60 * 60],
      [22, "5500.00", monthAgo + 28 * 24 * 60 * 60],
      [20, "5000.00", now - 14 * 24 * 60 * 60],
      [25, "6250.00", now - 7 * 24 * 60 * 60],
    ];

    salesData.forEach(([qty, revenue, saleDate], index) => {
      insertSale.run(
        `demo-sale-${index + 1}`,
        DEMO_VENDOR_ID,
        DEMO_PRODUCT_ID,
        qty,
        revenue,
        saleDate,
        now
      );
    });
  });

  try {
    seed();
    console.log("🌱 Seeded demo data for local testing");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("UNIQUE constraint failed")) {
      throw error;
    }
  }
}
