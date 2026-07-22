// Placeholder for token-balance / transaction endpoints that will be added
// to the Express backend in the next phase (deferred per the merge plan).
// Throwing here makes the call sites fail loudly during development so we
// don't accidentally ship a fetch that 404s in production.

export const tokensApi = {
  async getBalance(_vendorId: string): Promise<never> {
    throw new Error(
      "tokensApi.getBalance is not wired yet — backend endpoint pending",
    );
  },
  async getTransactions(_vendorId: string): Promise<never> {
    throw new Error(
      "tokensApi.getTransactions is not wired yet — backend endpoint pending",
    );
  },
};

export const paymentApi = {
  async initializePurchase(_input: unknown): Promise<never> {
    throw new Error(
      "paymentApi.initializePurchase is not wired yet — backend endpoint pending",
    );
  },
  async verify(_reference: string): Promise<never> {
    throw new Error(
      "paymentApi.verify is not wired yet — backend endpoint pending",
    );
  },
};