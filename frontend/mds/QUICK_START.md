# ⚠️ Pre-merge reference

This document describes the **pre-merge** Style Savant (Next.js app with an
in-repo dummy backend). After the merge with
[`application-service-backend`](../application-service-backend):

- The dummy backend code referenced here now lives under `../oldlib/`.
- The active app is a pure frontend that calls the Express backend via
  `/api/backend/*` (Next.js rewrite).
- For the current quick-start, see [`../README.md`](../README.md).
- For legacy prototype recovery, see [`../oldlib/README.md`](../oldlib/README.md).

Kept here for historical reference only.

---

# Quick Start Guide (legacy)

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies (2 min)
```bash
npm install
```

### 2. Setup Environment (1 min)
```bash
cp .env.example .env
```

**Minimal config for local testing:**
```env
# .env
USE_SQLITE=true
GOOGLE_GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server (1 min)
```bash
npm run dev
```

### 4. Test Features (1 min)
Open browser and test:

✅ **Home:** http://localhost:3000
- Click on any of the 3 feature cards

✅ **Smart Measurement:** http://localhost:3000/measurement
- Click "Start Scanning"
- Allow camera access
- Stand in front of camera

✅ **AI Inventory:** http://localhost:3000/inventory
- View dashboard (demo data)
- Try demand forecast
- Test background removal (needs API key)

✅ **Token Management:** http://localhost:3000/tokens
- View balance widget
- Check token bundles
- See transaction history

## 🎯 Demo Credentials

For testing, use:
- **Vendor ID:** `demo-vendor-123`
- **Email:** `vendor@example.com`

## 🔑 Getting API Keys

### Google Gemini (Required for AI features):
1. Visit: https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env` as `GOOGLE_GEMINI_API_KEY`

### Paystack (Required for token purchases):
1. Visit: https://dashboard.paystack.com/
2. Get test keys
3. Add to `.env`:
   - `PAYSTACK_SECRET_KEY=sk_test_...`
   - `PAYSTACK_PUBLIC_KEY=pk_test_...`

## 📁 Project Structure

```
app/
├── measurement/        # Smart measurement feature
├── inventory/         # AI inventory feature
├── tokens/           # Token system
└── api/             # All API routes

lib/
├── measurement/     # Measurement logic
├── inventory/      # AI inventory logic
├── tokens/        # Token system logic
└── db/           # Database setup

components/
├── measurement/   # Measurement UI
├── inventory/    # Inventory UI
├── tokens/      # Token UI
└── ui/         # Shared components
```

## 🧪 Testing Without API Keys

### What Works Without Keys:
- ✅ Smart Measurement (MediaPipe is client-side)
- ✅ Token balance UI (uses demo data)
- ✅ Inventory alerts UI
- ✅ Navigation and layouts

### What Needs API Keys:
- ⚠️ AI background removal (Google Gemini)
- ⚠️ AI demand insights (Google Gemini)
- ⚠️ Token purchases (Paystack)

## 🐛 Common Issues

### Issue: "Camera not accessible"
**Solution:** Use HTTPS or localhost (HTTP allowed)

### Issue: "Database connection failed"
**Solution:** Set `USE_SQLITE=true` in `.env`

### Issue: "API key not found"
**Solution:** Check `.env` file exists and has API keys

### Issue: "Build errors"
**Solution:** Run `npm install` again

## 📊 Feature Costs Reference

| Feature | Tokens | GHS |
|---------|--------|-----|
| Inventory Analysis | 10 | ~0.75 |
| Background Removal | 5 | ~0.375 |
| Demand Forecast | 15 | ~1.125 |
| Smart Measurement | FREE | 0 |

## 🎨 Main Pages

1. **Home** `/` - Feature overview
2. **Measurement** `/measurement` - Body scanning
3. **Inventory** `/inventory` - AI optimization
4. **Tokens** `/tokens` - Token management

## 📝 Next Steps

1. ✅ Get it running locally
2. ⚙️ Add your API keys
3. 🧪 Test all features
4. 📖 Read README.md for details
5. 🚀 Deploy to production (see DEPLOYMENT.md)

## 🆘 Need Help?

1. Check `README.md` for full docs
2. Check `DEPLOYMENT.md` for production setup
3. Check `PROJECT_SUMMARY.md` for architecture
4. Review code comments in source files

---

**Happy Coding! 🎉**
