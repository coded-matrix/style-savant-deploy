#!/usr/bin/env ts-node
import "dotenv/config";
import { GeminiService } from "../lib/inventory/gemini-service";

async function run() {
  const url = process.argv[2] || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600";

  console.log("Using GOOGLE_GEMINI_API_KEY:", !!process.env.GOOGLE_GEMINI_API_KEY);

  const svc = new GeminiService();

  try {
    const res = await svc.removeBackground(url);
    console.log("Result:", JSON.stringify(res, null, 2));
    if (!res.success) process.exit(2);
  } catch (err: any) {
    // Normalize common SDK error shapes
    if (err?.message) {
      console.error("Error:", err.message);
    } else if (err?.errorDetails) {
      console.error("Error details:", JSON.stringify(err.errorDetails));
    } else {
      console.error("Unknown error:", String(err));
    }
    process.exit(1);
  }
}

run();
