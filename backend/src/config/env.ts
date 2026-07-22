// One place that reads process.env. Everything configurable lives here with a sensible
// default, so changing an env var updates behaviour everywhere without touching code.

function str(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function list(key: string, fallback: string[]): string[] {
  const raw = process.env[key];
  if (!raw) return fallback;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export const config = {
  port: num('PORT', 3001),
  databaseUrl: str('DATABASE_URL'),

  cors: {
    // Defaults to localhost only. Production MUST set ALLOWED_ORIGINS or the real frontend is blocked.
    allowedOrigins: list('ALLOWED_ORIGINS', ['http://localhost:3000']),
  },

  jwt: {
    secret: str('JWT_SECRET'),
    expiresIn: str('JWT_EXPIRES_IN', '7d'),
    saltRounds: num('BCRYPT_SALT_ROUNDS', 10),
  },

  http: {
    jsonLimit: str('HTTP_JSON_LIMIT', '10mb'),
    uploadMaxBytes: num('UPLOAD_MAX_BYTES', 5 * 1024 * 1024),
    requestTimeoutMs: num('REQUEST_TIMEOUT_MS', 30000),
    aiRequestTimeoutMs: num('AI_REQUEST_TIMEOUT_MS', 120000),
    logFormat: str('LOG_FORMAT', 'dev'),
  },

  limits: {
    maxProductsPerVendor: num('MAX_PRODUCTS_PER_VENDOR', 20),
  },

  rateLimit: {
    aiWindowMs: num('RATE_LIMIT_AI_WINDOW_MS', 60 * 1000),
    aiMax: num('RATE_LIMIT_AI_MAX', 10),
    authWindowMs: num('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
    authMax: num('RATE_LIMIT_AUTH_MAX', 5),
  },

  ai: {
    geminiApiKey: str('GEMINI_API_KEY'),
    geminiTextModel: str('GEMINI_TEXT_MODEL', 'gemini-2.5-flash'),
    agnesKey: str('AGNES_AI'),
    agnesBaseUrl: str('AGNES_BASE_URL', 'https://apihub.agnes-ai.com/v1'),
    agnesImageModel: str('AGNES_IMAGE_MODEL', 'agnes-image-2.1-flash'),
    agnesImageSize: str('AGNES_IMAGE_SIZE', '1024x1024'),
    agnesTimeoutMs: num('AGNES_TIMEOUT_MS', 110000),
  },

  campaignApi: {
    baseUrl: str('CAMPAIGN_API_BASE_URL', 'https://api-hackathon.codedematrixtech.com'),
    merchantId: str('CAMPAIGN_API_MERCHANT_ID', 'rashida-tailors'),
    teamSlug: str('CAMPAIGN_API_TEAM_SLUG', 'style-savant'),
    timeoutMs: num('CAMPAIGN_API_TIMEOUT_MS', 30000),
  },

  tokens: {
    backgroundRemovalCost: num('TOKEN_COST_BACKGROUND_REMOVAL', 5),
    campaignCopyCost: num('TOKEN_COST_CAMPAIGN_COPY', 5),
    campaignImageCost: num('TOKEN_COST_CAMPAIGN_IMAGE', 10),
    tryonCost: num('TOKEN_COST_TRYON', 2),
    videoRequestCost: num('TOKEN_COST_VIDEO_REQUEST', 20),
    lowBalanceThreshold: num('TOKEN_LOW_BALANCE_THRESHOLD', 100),
    pricePer1000: num('TOKEN_PRICE_PER_1000', 75),
    bundleSizes: list('TOKEN_BUNDLE_SIZES', ['1000', '5000', '10000']).map(Number),
  },

  paystack: {
    secretKey: str('PAYSTACK_SECRET_KEY'),
    webhookSecret: str('PAYSTACK_WEBHOOK_SECRET'),
  },

  // Hubtel mobile-money billing (mirrors the coded_matrix esports setup:
  // initiate checkout -> customer approves on phone -> webhook callback ->
  // status-check fallback after 5 minutes).
  hubtel: {
    apiId: str('HUBTEL_API_ID'),
    apiKey: str('HUBTEL_API_KEY'),
    merchantAccountNumber: str('HUBTEL_MERCHANT_ACCOUNT_NUMBER'),
    paymentUrl: str('HUBTEL_PAYMENT_URL', 'https://payproxyapi.hubtel.com/items/initiate'),
    statusUrl: str('HUBTEL_STATUS_CHECK_URL', 'https://api-txnstatus.hubtel.com'),
    timeoutMs: num('HUBTEL_TIMEOUT_MS', 30000),
  },

  billing: {
    // Flat monthly plan fee in GHS, after the free trial month.
    monthlyFeeGhs: num('BILLING_MONTHLY_FEE_GHS', 100),
    // Tokens included with each paid month (try-on = 2 tokens => ~600 try-ons).
    monthlyTokens: num('BILLING_MONTHLY_TOKENS', 1200),
    // Free-trial length in days for new vendors.
    trialDays: num('BILLING_TRIAL_DAYS', 30),
  },

  storage: {
    // Which object-storage backend to use: 'local' | 's3' | 'cloudinary'.
    // 'local' writes to disk and serves over /uploads — zero external deps,
    // for dev. Set to 's3' or 'cloudinary' in production (see the adapters).
    driver: str('STORAGE_DRIVER', 'local'),
    // Absolute base URL the browser uses to reach stored files. For 'local'
    // this must point at this server (default matches the dev port).
    publicBaseUrl: str('STORAGE_PUBLIC_BASE_URL', `http://localhost:${num('PORT', 3001)}`),
    // Local driver: directory (relative to backend root) where files are written.
    localDir: str('STORAGE_LOCAL_DIR', 'uploads'),
    maxUploadBytes: num('STORAGE_MAX_UPLOAD_BYTES', 8 * 1024 * 1024),
    // Videos (feed/look clips) are allowed to be larger than images.
    maxVideoUploadBytes: num('STORAGE_MAX_VIDEO_UPLOAD_BYTES', 50 * 1024 * 1024),

    // S3 (only read when driver === 's3')
    s3: {
      bucket: str('S3_BUCKET'),
      region: str('S3_REGION', 'us-east-1'),
      accessKeyId: str('S3_ACCESS_KEY_ID'),
      secretAccessKey: str('S3_SECRET_ACCESS_KEY'),
      // Optional CDN / custom domain in front of the bucket for serving.
      publicUrl: str('S3_PUBLIC_URL'),
    },

    // Cloudinary (only read when driver === 'cloudinary')
    cloudinary: {
      url: str('CLOUDINARY_URL'), // cloudinary://<key>:<secret>@<cloud_name>
      folder: str('CLOUDINARY_FOLDER', 'style-savant'),
    },
  },
};

// Called once at startup so the server fails fast instead of erroring mid-request
export function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'AGNES_AI'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
