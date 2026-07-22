# ⚠️ Pre-merge reference

This checklist was written for the **pre-merge** Style Savant with its
in-repo dummy backend. After the merge with
[`application-service-backend`](../application-service-backend), several of
the items here no longer apply (e.g. SQLite seed, dummy `/api/...` calls).
For the current verification steps, see the "Verification" section of
[`../README.md`](../README.md).

Kept here for historical reference only.

---

# Testing Checklist (legacy)

## Pre-Testing Setup

- [ ] Run `npm install` successfully
- [ ] Create `.env` file from `.env.example`
- [ ] Set `USE_SQLITE=true` for local testing
- [ ] Start dev server with `npm run dev`
- [ ] Open http://localhost:3000

## 🏠 Homepage Tests

### Visual Checks
- [ ] Homepage loads without errors
- [ ] Three feature cards visible (Measurement, Inventory, Tokens)
- [ ] All cards have proper icons and descriptions
- [ ] Gradient backgrounds render correctly
- [ ] Navigation links work

### Functionality
- [ ] Click "Smart Measurement" card → redirects to `/measurement`
- [ ] Click "AI Inventory" card → redirects to `/inventory`
- [ ] Click "Token Management" card → redirects to `/tokens`
- [ ] No console errors on page load

## 📏 Smart Measurement Tests

### Page Load
- [ ] Page loads at `/measurement`
- [ ] Camera permission dialog appears
- [ ] UI renders without errors
- [ ] Instructions are clear

### Scanner Functionality
- [ ] Click "Start Scanning" button
- [ ] Camera feed appears
- [ ] MediaPipe detects body (green dots on joints)
- [ ] Measurements calculate automatically
- [ ] Results display: chest, waist, hips, inseam, sleeve
- [ ] Size recommendation shows (S/M/L/XL)
- [ ] "Save Measurements" button works

### Edge Cases
- [ ] Test without camera access → shows error message
- [ ] Test with poor lighting → still attempts detection
- [ ] Test at different distances → adapts
- [ ] Test "Stop Scanning" button

## 📊 AI Inventory Tests

### Page Load
- [ ] Page loads at `/inventory`
- [ ] Three tabs visible: Dashboard, Forecast, Background Removal
- [ ] Token balance widget shows (sidebar)
- [ ] Feature costs card displays

### Dashboard Tab
- [ ] Click "Dashboard" tab
- [ ] Inventory alerts panel loads
- [ ] Shows restock alerts section
- [ ] Shows overstock alerts section
- [ ] Displays "No alerts" if empty (expected for new setup)
- [ ] Alert urgency colors correct (red=critical, orange=high, etc.)

### Forecast Tab
- [ ] Click "Demand Forecast" tab
- [ ] Forecast widget appears
- [ ] Three period buttons: Week, Month, Quarter
- [ ] "Generate Forecast" button visible
- [ ] Click button → attempts to generate (may fail without sales data)
- [ ] Shows appropriate error if no data

### Background Removal Tab
- [ ] Click "Background Removal" tab
- [ ] Upload area visible
- [ ] "Choose Image" button works
- [ ] Upload dialog opens
- [ ] Select image → processes (needs Google API key)
- [ ] Shows token cost (5 tokens)
- [ ] Shows error if insufficient tokens or no API key

### Token Balance Widget
- [ ] Balance widget loads in sidebar
- [ ] Shows token count or "No balance" message
- [ ] Low balance alert appears if < 100 tokens
- [ ] Progress bar displays correctly
- [ ] "Purchase More Tokens" button works → redirects to `/tokens`

## 💎 Token Management Tests

### Page Load
- [ ] Page loads at `/tokens`
- [ ] Three tabs: Balance, Purchase, History
- [ ] Sidebar info cards display

### Balance Tab
- [ ] Shows token balance widget
- [ ] Displays usage guide with feature costs
- [ ] All costs listed correctly:
  - Inventory Analysis: 10 tokens
  - Background Removal: 5 tokens
  - Demand Forecast: 15 tokens
  - Smart Measurement: Free

### Purchase Tab
- [ ] Click "Purchase" tab
- [ ] Three token bundles display:
  - 1,000 tokens - GHS 75
  - 5,000 tokens - GHS 350 (+ 250 bonus)
  - 10,000 tokens - GHS 650 (+ 500 bonus)
- [ ] Click bundle → highlights with blue border
- [ ] Payment summary updates
- [ ] Shows bonus tokens for 5K and 10K bundles
- [ ] "Proceed to Payment" button visible
- [ ] Click button → needs Paystack keys (will fail without)

### History Tab
- [ ] Click "History" tab
- [ ] Shows "No transactions yet" for new account
- [ ] Or displays transaction list if data exists
- [ ] Each transaction shows: description, date, amount, balance

### Sidebar Cards
- [ ] "100% Revenue Retained" card displays
- [ ] Shows GHS 75 per 1,000 tokens
- [ ] "Act 987 Compliant" card displays

## 🔌 API Endpoint Tests

### Token APIs
```bash
# Test balance endpoint
curl http://localhost:3000/api/tokens/balance?vendorId=demo-vendor-123
# Expected: { success: boolean, balance: {...} } or error

# Test transactions endpoint
curl http://localhost:3000/api/tokens/transactions?vendorId=demo-vendor-123
# Expected: { success: boolean, transactions: [] }
```

### Inventory APIs
```bash
# Test alerts endpoint
curl http://localhost:3000/api/inventory/alerts?vendorId=demo-vendor-123
# Expected: { success: boolean, alerts: { restock: [], overstock: [] } }

# Test forecast endpoint
curl "http://localhost:3000/api/inventory/forecast?vendorId=demo-vendor-123&productId=test&period=month"
# Expected: { success: boolean, forecast: {...} } or { error: "No sales data" }
```

### Measurements API
```bash
# Test measurements POST (needs body)
curl -X POST http://localhost:3000/api/measurements \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","chest":40,"waist":32}'
# Expected: { success: boolean, measurement: {...} }
```

## 🗄️ Database Tests

### SQLite Mode (Local)
- [ ] Set `USE_SQLITE=true` in `.env`
- [ ] Restart dev server
- [ ] Console shows "🗄️ Using SQLite database"
- [ ] `dev.db` file created in project root
- [ ] Pages load without database errors

### PostgreSQL Mode (Optional)
- [ ] Set `USE_SQLITE=false` in `.env`
- [ ] Add valid `DATABASE_URL`
- [ ] Restart dev server
- [ ] Console shows "🐘 Using PostgreSQL database"
- [ ] Pages load without database errors

## 🎨 UI/UX Tests

### Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] All layouts adapt properly
- [ ] No horizontal scroll

### Colors & Branding
- [ ] Purple primary color (#9333EA) used consistently
- [ ] Pink accent (#EC4899) on gradients
- [ ] Blue for info elements
- [ ] Green for success/free features
- [ ] Red for warnings/critical alerts

### Animations
- [ ] Hover effects on cards
- [ ] Loading spinners appear during async operations
- [ ] Smooth transitions between tabs
- [ ] Progress bars animate

### Accessibility
- [ ] All buttons have proper labels
- [ ] Colors have sufficient contrast
- [ ] Forms have error messages
- [ ] Loading states are clear

## 🔐 Security Tests

### API Keys
- [ ] No API keys visible in browser console
- [ ] No API keys in client-side code
- [ ] API keys only in server-side code
- [ ] `.env` file in `.gitignore`

### Input Validation
- [ ] Test invalid vendor IDs → proper error
- [ ] Test SQL injection attempts → blocked by Drizzle
- [ ] Test XSS attempts → React escapes by default

## ⚠️ Error Handling Tests

### Network Errors
- [ ] Disconnect internet → shows error messages
- [ ] Reconnect → features work again

### API Errors
- [ ] Invalid vendorId → shows error
- [ ] Missing API key → shows error
- [ ] Insufficient tokens → shows error (402 status)

### User Errors
- [ ] No camera access → clear error message
- [ ] Invalid image upload → error message
- [ ] Empty form submission → validation error

## 📊 Performance Tests

### Page Load Speed
- [ ] Homepage loads < 2 seconds
- [ ] Measurement page loads < 2 seconds
- [ ] Inventory page loads < 2 seconds
- [ ] Tokens page loads < 2 seconds

### API Response Times
- [ ] Token balance API < 500ms
- [ ] Inventory alerts API < 1 second
- [ ] Measurement save API < 500ms

### Memory Usage
- [ ] No memory leaks on page navigation
- [ ] Camera stream stops when scanner closes
- [ ] No console warnings about performance

## 🚀 Build Tests

### Development Build
```bash
npm run dev
```
- [ ] Builds successfully
- [ ] Hot reload works
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Production Build
```bash
npm run build
npm start
```
- [ ] Builds successfully
- [ ] No build errors
- [ ] Optimized bundle size
- [ ] All pages work in production mode

## ✅ Final Checks

### Code Quality
- [ ] No console.log statements (except intentional)
- [ ] No commented-out code
- [ ] Proper error handling everywhere
- [ ] TypeScript types defined
- [ ] Code formatted consistently

### Documentation
- [ ] README.md complete
- [ ] DEPLOYMENT.md complete
- [ ] PROJECT_SUMMARY.md complete
- [ ] QUICK_START.md complete
- [ ] This checklist complete

### Git
- [ ] All files committed
- [ ] Proper .gitignore
- [ ] No sensitive data in repo
- [ ] Clean working directory

## 🎉 Sign-Off

- [ ] All critical tests pass
- [ ] No blocking errors
- [ ] Documentation complete
- [ ] Ready for deployment

---

## 📝 Test Results Log

**Date:** ________________
**Tester:** ________________
**Environment:** ☐ Local ☐ Staging ☐ Production

**Overall Result:** ☐ PASS ☐ FAIL

**Notes:**
_________________________________
_________________________________
_________________________________

**Issues Found:**
1. _________________________________
2. _________________________________
3. _________________________________

**Next Steps:**
_________________________________
_________________________________
_________________________________

---

**Tested by:** ________________
**Date:** ________________
**Signature:** ________________
