// Paystack Service - Handle token purchases

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    customer: {
      email: string;
    };
    metadata: Record<string, any>;
  };
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = "https://api.paystack.co";

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || "";
    if (!this.secretKey) {
      console.warn("⚠️  PAYSTACK_SECRET_KEY not set - Paystack operations will be disabled");
    }
  }

  /**
   * Initialize a payment transaction
   */
  async initializeTransaction(
    email: string,
    amount: number,
    metadata: Record<string, any>
  ): Promise<PaystackInitializeResponse> {
    if (!this.secretKey) {
      return {
        status: false,
        message: "Paystack secret key not configured",
        data: { authorization_url: "", access_code: "", reference: "" },
      } as unknown as PaystackInitializeResponse;
    }

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to pesewas
        metadata,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/tokens/callback`,
      }),
    });

    return await response.json();
  }

  /**
   * Verify a payment transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (!this.secretKey) {
      return {
        status: false,
        message: "Paystack secret key not configured",
        data: {
          id: 0,
          status: "failed",
          reference,
          amount: 0,
          customer: { email: "" },
          metadata: {},
        },
      } as unknown as PaystackVerifyResponse;
    }

    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      }
    );

    return await response.json();
  }
}
