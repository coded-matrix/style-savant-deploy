# ⚠️ Pre-merge reference

This document describes deployment of the **pre-merge** Style Savant. After
the merge with [`application-service-backend`](../application-service-backend),
the deployment topology is a two-service one. See the deployment matrix in
[`../README.md`](../README.md).

Kept here for historical reference only.

---

# Deployment Guide (legacy)

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set:

```env
# Production Database
DATABASE_URL="postgresql://user:password@host:5432/database"
USE_SQLITE=false

# Google Gemini AI
GOOGLE_GEMINI_API_KEY="your_production_api_key"

# Paystack (Production Keys)
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_WEBHOOK_SECRET="your_production_webhook_secret"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate_with_openssl_rand_base64_32"

# App Config
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

### 2. Database Setup

#### Option A: PostgreSQL (Recommended for Production)

1. **Create PostgreSQL database:**
```bash
createdb coded_marketplace
```

2. **Run migrations:**
```bash
npm run db:push
```

3. **Verify tables:**
```bash
npm run db:studio
```

#### Option B: SQLite (Development/Testing Only)
Set `USE_SQLITE=true` in `.env` - database will be auto-created.

### 3. API Keys

#### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to environment variables

#### Paystack
1. Visit [Paystack Dashboard](https://dashboard.paystack.com/)
2. Get **Live** API keys (not test keys)
3. Set up webhook URL: `https://yourdomain.com/api/webhooks/paystack`
4. Copy webhook secret

### 4. Build & Test Locally

```bash
# Install dependencies
npm install

# Build project
npm run build

# Test production build
npm start
```

Visit `http://localhost:3000` and test:
- ✅ Smart Measurement scanner
- ✅ Token balance loading
- ✅ Inventory alerts generation
- ✅ Token purchase flow

## Deployment Platforms

### Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel --prod
```

4. **Set Environment Variables:**
Go to Vercel Dashboard → Project → Settings → Environment Variables

Add all variables from the checklist above.

5. **Configure Database:**
- Use Vercel Postgres or external PostgreSQL (Supabase, Neon, etc.)
- Add connection string to `DATABASE_URL`

### Other Platforms

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Netlify
- Connect GitHub repository
- Build command: `npm run build`
- Publish directory: `.next`
- Set environment variables in Netlify dashboard

#### DigitalOcean App Platform
- Connect GitHub repository
- Detect Next.js automatically
- Configure environment variables
- Add PostgreSQL database

## Post-Deployment

### 1. Webhook Configuration

**Paystack Webhook:**
- URL: `https://yourdomain.com/api/webhooks/paystack`
- Events: `charge.success`

Test webhook:
```bash
curl -X POST https://yourdomain.com/api/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test" \
  -d '{"event":"charge.success"}'
```

### 2. Health Checks

Create monitoring for:
- `/api/tokens/balance?vendorId=test` - Token system
- `/api/inventory/alerts?vendorId=test` - Inventory AI
- `/measurement` - Smart measurement page

### 3. Database Monitoring

Monitor:
- Connection pool usage
- Query performance
- Table sizes

### 4. Error Tracking

Recommended tools:
- Sentry
- LogRocket
- Vercel Analytics

## Production Optimizations

### 1. Image Optimization
Next.js automatically optimizes images. Configure:

```javascript
// next.config.ts
module.exports = {
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
}
```

### 2. Database Connection Pooling
Already configured in `/lib/db/index.ts`:
```typescript
const client = postgres(connectionString, { prepare: false });
```

### 3. API Rate Limiting
Implement rate limiting for token-gated APIs.

### 4. Caching
Enable Vercel Edge caching for static assets.

## Scaling Considerations

### Database
- Start: Single PostgreSQL instance
- Scale: Read replicas for inventory queries
- Optimize: Index on `vendorId` columns

### AI Services
- Google Gemini: Free tier → Paid tier as needed
- Monitor: Token usage per vendor
- Optimize: Batch analysis requests

### Storage
- Product images: Use CDN (Cloudflare, Cloudinary)
- Measurement data: Keep in database
- Processed images: S3 or R2 storage

## Monitoring & Alerts

### Key Metrics
1. **Token System**
   - Purchase success rate
   - Token balance alerts triggered
   - Payment failures

2. **AI Features**
   - API success rate
   - Average response time
   - Token consumption rate

3. **Smart Measurement**
   - Scanner usage
   - Measurement accuracy reports
   - Camera access errors

### Alert Thresholds
- API error rate > 5%
- Response time > 3s
- Token balance < 10 for any vendor
- Payment failure rate > 10%

## Backup & Recovery

### Database Backups
```bash
# Automated backups (PostgreSQL)
pg_dump coded_marketplace > backup_$(date +%Y%m%d).sql
```

### Disaster Recovery Plan
1. Database: Daily backups, 30-day retention
2. Code: GitHub repository
3. Environment variables: Secure vault (1Password, etc.)

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys in environment (not code)
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on all APIs
- [ ] SQL injection prevention (Drizzle ORM)
- [ ] XSS protection (React defaults)

## Support & Maintenance

### Regular Tasks
- **Weekly:** Monitor error logs
- **Monthly:** Review AI usage and costs
- **Quarterly:** Security audit
- **Yearly:** Dependency updates

### Contact
For deployment issues, contact the development team.

---

**Last Updated:** June 19, 2026
