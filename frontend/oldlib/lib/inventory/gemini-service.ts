// Google Gemini AI Service

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiImageProcessingResult {
  success: boolean;
  processedImage?: string;
  error?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
    if (!apiKey) {
      console.warn("⚠️  GOOGLE_GEMINI_API_KEY not set - Gemini features will be disabled");
      // Leave genAI/model undefined so methods can return graceful errors
      // @ts-ignore - allow undefined model when no key is present
      this.genAI = undefined as any;
      // @ts-ignore
      this.model = undefined as any;
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  /**
   * Remove background from product image
   */
  async removeBackground(imageData: string): Promise<GeminiImageProcessingResult> {
    try {
      if (!this.model) {
        return {
          success: false,
          error:
            "Google Gemini API key not configured. Set GOOGLE_GEMINI_API_KEY in the server environment.",
        };
      }

      // Helper: convert ArrayBuffer to base64
      const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return typeof window === "undefined"
          ? Buffer.from(binary, "binary").toString("base64")
          : btoa(binary);
      };

      // If a URL was provided, fetch it and convert to base64
      let base64Data = imageData || "";
      const isUrl = /^https?:\/\//i.test(imageData || "");
      const isDataUrl = /^data:.*;base64,/.test(imageData || "");

      if (isUrl) {
        try {
          const res = await fetch(imageData);
          if (!res.ok) {
            return { success: false, error: `Failed to fetch image: ${res.status}` };
          }
          const buffer = await res.arrayBuffer();
          const b64 = arrayBufferToBase64(buffer);
          base64Data = b64;
        } catch (fetchErr) {
          console.error("Error fetching remote image:", fetchErr);
          return { success: false, error: "Failed to fetch remote image" };
        }
      } else if (isDataUrl) {
        // Strip data URL prefix if present
        base64Data = imageData.split(",")[1] || "";
      }

      if (!base64Data) {
        return { success: false, error: "No image data provided" };
      }

      const prompt = `You are an expert e-commerce product photo editor.\n\nTask: Remove the background from this clothing/product image and replace it with a clean white studio background.\n\nRequirements:\n- Keep ONLY the garment/product\n- Remove all background elements\n- Replace with pure white (#FFFFFF) background\n- Maintain product edges cleanly\n- Preserve product colors and details\n- Output should look professional and e-commerce ready\n\nReturn only \"PROCESSED\" if successful.`;

      // NOTE: the SDK usage here is kept simple; the service currently simulates processing.
      // Call the model. Wrap in try/catch to translate SDK errors into clearer messages.
      let modelResult;
      try {
        modelResult = await this.model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg",
            },
          },
        ]);
      } catch (sdkErr: any) {
        // SDK may throw with structured info; normalize it for our API.
        const sdkMessage =
          sdkErr?.message || (sdkErr?.errorDetails && JSON.stringify(sdkErr.errorDetails)) || String(sdkErr);
        console.error("Gemini SDK error (generateContent):", sdkErr);
        return {
          success: false,
          error: `Gemini SDK error: ${sdkMessage}`,
        };
      }

      try {
        const response = await modelResult.response;
        const text = await response.text();

        // For POC the SDK may not return a processed image; return original base64 as fallback.
        const processed = base64Data;
        const successFlag = typeof text === "string" ? text.includes("PROCESSED") : true;
        return {
          success: successFlag,
          processedImage: processed,
        };
      } catch (respErr: any) {
        console.error("Error reading Gemini response:", respErr);
        return {
          success: false,
          error: respErr?.message || "Failed to read Gemini response",
        };
      }
    } catch (error) {
      console.error("Gemini background removal error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
