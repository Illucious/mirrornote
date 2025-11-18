# Authentication Debugging Guide

## Current Issue
Session tokens are not being created after Google OAuth signup because the `session_id` isn't being captured from the deep link.

## Steps to Debug

### Step 1: Check Deep Link Logs
1. **Clear the app data** in Expo Go (long press app → clear)
2. **Start the app** and watch console logs
3. **Click "Continue with Google"** on login screen
4. Look for this log:
   ```
   [AuthContext] Redirect URL for auth: mirrornote:///(tabs)/dashboard
   [AuthContext] Opening auth URL: https://auth.emergentagent.com/...
   ```

### Step 2: Complete OAuth Flow
1. **Sign in with Google** in the browser
2. **Watch for redirect** back to app
3. Look for these logs:
   ```
   [AuthContext] Deep link received: mirrornote://...
   [AuthContext] Deep link query params: {"session_id":"..."}
   [AuthContext] Found session_id in deep link, processing...
   ```

**If you DON'T see "Deep link received"** → The deep link isn't working properly

**If you see "No session_id in deep link query params"** → The session_id format is wrong

### Step 3: Use Debug Screen (Manual Testing)
If deep linking isn't working, you can manually test the session flow:

1. **In browser**, complete the Google OAuth flow
2. **Copy the URL** you're redirected to (it should contain `session_id`)
3. **Extract the session_id** value from the URL
4. **Navigate to debug screen** in your app: Navigate to `/debug-auth`
5. **Paste the session_id** and click "Test Session ID"
6. **Check logs** for:
   ```
   [DEBUG] Testing session_id: xxx
   [DEBUG] Response: {...}
   [DEBUG] Token stored
   [DEBUG] Token retrieved: true
   ```

### Step 4: Verify Token Storage
In the debug screen:
1. Click **"Check Current Token"**
2. Should show: `Token: Found (...)`

If token is found, try recording again - it should now work!

### Step 5: Backend Verification
Check if backend is receiving the request properly:

```bash
# Watch backend logs
cd backend
# Your backend logs should show:
# POST /api/auth/session - Session token created
# POST /api/analyze-voice - Authorization header received
```

## Common Issues and Fixes

### Issue 1: Deep Link Not Opening App
**Symptoms:** Browser shows "Cannot open mirrornote://" or nothing happens after OAuth

**Cause:** Expo Go might not have registered the deep link scheme

**Fix:**
- Restart Expo Go completely
- Clear Expo Go cache
- Make sure `app.json` has `"scheme": "mirrornote"`
- In development, the URL scheme is: `exp://192.168.x.x:8081/--/(tabs)/dashboard`

**Alternate Solution:** Use the debug screen to manually enter session_id

### Issue 2: session_id Not in Query Params
**Symptoms:** Logs show "No session_id in deep link query params"

**Cause:** Emergent Auth might be using a different parameter format

**Check:** In the deep link URL, look for these patterns:
- `?session_id=xxx`
- `#session_id=xxx`
- `/session_id/xxx`

**If format is different**, we need to update the parsing logic in AuthContext.tsx

### Issue 3: Backend Returns 401 for /auth/session
**Symptoms:** Debug screen shows "Error: Failed to validate session"

**Cause:** 
- Invalid session_id (expired or malformed)
- Backend can't reach Emergent Auth API
- Wrong session_id format

**Fix:**
- Try a fresh OAuth flow to get a new session_id
- Check backend logs for detailed error
- Verify backend has network access to `https://demobackend.emergentagent.com`

### Issue 4: Token Stored But Still Getting 401
**Symptoms:** 
- Debug screen shows token is stored
- API calls still fail with 401

**Possible causes:**
1. **Token expired** - Check if `expires_at` in MongoDB is in the past
2. **Wrong token format** - Token should not have extra quotes or spaces
3. **Backend session validation failing** - Check backend logs

**Debug:**
```bash
# Check MongoDB for session
mongo
use your_db_name
db.user_sessions.find().sort({created_at: -1}).limit(1)
```

## Testing Checklist

- [ ] Backend server is running on correct URL
- [ ] Frontend has correct `EXPO_PUBLIC_BACKEND_URL` in `.env`
- [ ] App scheme in `app.json` matches redirect URL scheme
- [ ] MongoDB is accessible and has `users` and `user_sessions` collections
- [ ] Emergent Auth URL is correct: `https://auth.emergentagent.com`
- [ ] Session validation API is accessible: `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data`

## Next Steps After Debugging

Once you identify where the flow breaks:

1. **If deep linking works** but session_id parsing fails:
   - Share the exact deep link URL format
   - We'll update the parsing logic

2. **If deep linking doesn't work** at all:
   - Use debug screen as workaround
   - We may need to implement a different OAuth flow (like in-app browser)

3. **If session creation works** but token isn't being used:
   - Check axios interceptor logs
   - Verify headers are being set correctly

4. **If everything works on debug screen** but not in normal flow:
   - The issue is specifically with deep link handling
   - We need to investigate Expo's Linking API behavior

## Manual Test Command (Backend)

Test the backend directly with curl:

```bash
# Replace with actual values
SESSION_ID="your-session-id-here"

# Test session creation
curl -X POST http://localhost:8000/api/auth/session \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\"}"

# Should return something like:
# {"id":"...","email":"...","session_token":"..."}

# Save the session_token and test authenticated endpoint
TOKEN="your-session-token-here"

curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Should return user data
```

## Contact Points for Support

If you're still stuck after trying these steps, gather:
1. Full console logs from app startup to error
2. Deep link URL (if you can see it)
3. Backend logs for the session creation attempt
4. Screenshot of debug screen results
