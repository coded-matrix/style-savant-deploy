// Database Setup Script - Initialize tables for all features

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function setupDatabase() {
  console.log("🗄️  Setting up database...");

  try {
    // Create enum types if using PostgreSQL
    if (process.env.USE_SQLITE !== "true") {
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE token_transaction_type AS ENUM ('purchase', 'usage', 'refund');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE ai_feature_type AS ENUM ('inventory_analysis', 'background_removal', 'demand_forecast');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    console.log("✅ Database setup complete!");
    console.log("\n📊 Tables created:");
    console.log("  - users");
    console.log("  - vendors");
    console.log("  - products");
    console.log("  - body_measurements");
    console.log("  - orders");
    console.log("  - order_items");
    console.log("  - subscriptions");
    console.log("  - token_transactions");
    console.log("  - ai_usage_logs");
    console.log("  - inventory_analyses");
    console.log("  - sales_history");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
