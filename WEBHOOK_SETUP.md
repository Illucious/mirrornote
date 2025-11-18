# Setting Up Webhooks for Local Development

## Quick Setup with ngrok

### Step 1: Start Your Backend
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Install ngrok (if not already installed)
```bash
# Option A: Using npm (you already have @expo/ngrok)
npx ngrok http 8000

# Option B: Download from https://ngrok.com/download
# Then run: ngrok http 8000
```

### Step 3: Get Your Public URL
After running ngrok, you'll see something like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8000
```

### Step 4: Configure Razorpay Webhook
1. Go to https://dashboard.razorpay.com/
2. Navigate to **Settings → Webhooks**
3. Click **"Add New Webhook"**
4. Enter URL: `https://abc123.ngrok.io/api/payment/webhook`
   (Replace `abc123.ngrok.io` with your actual ngrok URL)
5. Select events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
6. Click **Save**
7. **Copy the webhook secret** (starts with `whsec_`)

### Step 5: Add to Backend .env
```env
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 6: Restart Backend
```bash
# Stop and restart your backend server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

## Important Notes

⚠️ **ngrok URLs change every time** (unless you have a paid plan)
- Free ngrok URLs change on restart
- You'll need to update the webhook URL in Razorpay dashboard each time

💡 **For Production:**
- Use your actual domain: `https://yourdomain.com/api/payment/webhook`
- Webhook URL will be permanent

## Testing Webhooks

1. Make a test payment
2. Check your backend logs - you should see webhook requests
3. Check Razorpay Dashboard → Webhooks → Logs to see delivery status

## Alternative: Use localtunnel (Free, No Signup)

```bash
# Install
npm install -g localtunnel

# Run
lt --port 8000

# Use the provided URL in Razorpay webhook settings
```

