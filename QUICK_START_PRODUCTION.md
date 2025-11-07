# Quick Start: Production Setup

## 🔐 Google Authentication (5 minutes)

### Backend Changes:
```bash
cd /app/backend
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

1. Copy `/app/PRODUCTION_INTEGRATION_GUIDE.md` auth.py code → Create `/app/backend/auth.py`
2. Add 3 endpoints to server.py:
   - `POST /api/auth/session`
   - `GET /api/auth/me`
   - `POST /api/auth/logout`

### Frontend Changes:
1. Update `AuthContext.tsx` with Google OAuth flow (see guide)
2. Update `login.tsx` with Google sign-in button
3. Add to `app.json`:
   ```json
   {
     "expo": {
       "scheme": "mirrornote"
     }
   }
   ```

**That's it!** Users will be redirected to Google, authenticate, and return to your app.

---

## 💳 Razorpay Payments (10 minutes)

### Get API Keys:
1. Sign up at https://dashboard.razorpay.com/
2. Get `Key ID` and `Key Secret`
3. Create webhook secret

### Backend Setup:
```bash
cd /app/backend
pip install razorpay
```

Add to `.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
```

1. Copy payment.py from guide → Create `/app/backend/payment.py`
2. Add 3 endpoints to server.py:
   - `POST /api/payment/create-order`
   - `POST /api/payment/verify`
   - `POST /api/payment/webhook`

### Frontend Setup:
```bash
cd /app/frontend
yarn add react-native-razorpay
```

Update `payment.tsx` with Razorpay integration (see guide)

### Configure Webhook:
1. Go to Razorpay Dashboard → Webhooks
2. Add: `https://your-app.com/api/payment/webhook`
3. Select: payment.captured, payment.failed

---

## 📋 Testing Checklist

### Google Auth:
- [ ] Click "Continue with Google"
- [ ] Authenticate with Google
- [ ] Return to app dashboard
- [ ] Session persists after app restart
- [ ] Logout works

### Razorpay:
- [ ] Select plan (monthly/yearly)
- [ ] Click "Pay" button
- [ ] Complete test payment (card: 4111 1111 1111 1111)
- [ ] Verify premium status updated
- [ ] Check MongoDB subscription record

---

## 🚀 Go Live

### Switch to Production:

**Google Auth:**
- Already production-ready! Uses Emergent Auth service.

**Razorpay:**
1. Get live API keys from Razorpay Dashboard
2. Update `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```
3. Update webhook URL to production domain
4. Test with real payment

---

## 📄 Full Documentation

See `/app/PRODUCTION_INTEGRATION_GUIDE.md` for:
- Complete code examples
- Error handling
- Security best practices
- Troubleshooting guide
- Testing procedures

---

## 🆘 Need Help?

**Common Issues:**

1. **Google Auth not redirecting back:**
   - Check app scheme in app.json
   - Verify redirect URL is correct

2. **Razorpay signature error:**
   - Verify API keys are correct
   - Check order_id matches

3. **Session not persisting:**
   - Ensure cookies are httpOnly, secure
   - Check MongoDB connection

**Still stuck?** Check the detailed guide or create a support ticket.
