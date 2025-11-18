# Authentication Flow Test Guide

**IMPORTANT UPDATE:** Added comprehensive debugging to identify why session tokens aren't being created.

## Issues Fixed

### 1. **Backend API Request Body Mismatch** (CRITICAL FIX)
**Problem:** The `/api/auth/session` endpoint was expecting `session_id` as a query parameter, but the frontend was sending it in the request body as JSON.

**Fix:** Added `SessionRequest` Pydantic model to properly handle the request body:
```python
class SessionRequest(BaseModel):
    session_id: str

@api_router.post("/auth/session")
async def create_session(request_data: SessionRequest, response: Response):
    return await auth_service.process_session_id(request_data.session_id, response)
```

### 2. **Axios Headers Initialization**
**Problem:** Axios interceptor might fail if headers object doesn't exist.

**Fix:** Added null check before setting Authorization header:
```typescript
if (!config.headers) {
  config.headers = {} as any;
}
config.headers.Authorization = `Bearer ${token}`;
```

### 3. **Enhanced Debugging**
**Added:** Comprehensive console logging throughout the auth flow to track:
- Token storage and retrieval
- Session processing
- Authorization header injection
- API request/response flow

## New Debugging Tools

### Debug Auth Screen
A new screen at `/debug-auth` allows you to:
- Manually test session_id processing
- Check current token status
- Clear stored tokens
- See detailed API responses

### Enhanced Logging
Added comprehensive console logging throughout the auth flow to track:
- Initial URL and query params
- Deep link events and parsing
- Session token creation and storage
- Authorization header injection

## Testing Steps

### 1. Restart Backend Server
```bash
cd backend
# Stop any running instance
# Restart with:
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### 2. Clear Frontend App Data
In Expo Go:
- Long press on the app
- Clear storage/cache
- Restart the app

### 3. Test Authentication Flow
1. **Sign up** with Google OAuth
2. **Check console logs** for:
   - `[AuthContext] Processing session_id:`
   - `[AuthContext] Session response received:`
   - `[AuthContext] Session token stored in AsyncStorage`
   - `[AuthContext] Token verification - stored successfully: true`

3. **Navigate to home** and start voice recording
4. **Check console logs** for:
   - `[AuthContext] Interceptor - Token from storage: Found`
   - `[AuthContext] Interceptor - Added Authorization header to request:`

5. **Verify API call** succeeds without "not authenticated" error

## Navigate to Debug Screen

To access the debug screen, you can manually navigate in your browser or add a button:
- URL: Navigate to `/debug-auth` from any screen
- Or add temporary navigation in your profile/settings screen

## Expected Console Output

### When App Starts:
```
[AuthContext] Initial URL: mirrornote:///(tabs)/dashboard (or null)
[AuthContext] Parsed query params: {...}
[AuthContext] Checking session - Token: Not found (if fresh install)
```

### During Login:
```
[AuthContext] Processing session_id: xxx-xxx-xxx
[AuthContext] Session response received: { hasSessionToken: true, userData: 'user@example.com' }
[AuthContext] Session token stored in AsyncStorage
[AuthContext] Token verification - stored successfully: true
[AuthContext] User state updated: user@example.com
```

### During API Calls:
```
[AuthContext] Interceptor - Token from storage: Found
[AuthContext] Interceptor - Added Authorization header to request: http://xxx/api/analyze-voice
```

## Debugging If Issues Persist

If you still see authentication errors:

1. **Check Backend Logs** for incoming Authorization headers
2. **Verify BACKEND_URL** in frontend/.env matches your backend server
3. **Check MongoDB** that sessions are being created:
   ```javascript
   db.user_sessions.find({}).sort({created_at: -1}).limit(1)
   ```
4. **Test Backend Directly** with curl:
   ```bash
   # Get session token from your first successful login
   curl -X POST http://localhost:8000/api/analyze-voice \
     -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"audio_base64":"test","user_id":"test","recording_mode":"interview","recording_time":30}'
   ```

## Root Cause Summary

The authentication was failing because:
1. **Session token was never created** - The `/api/auth/session` endpoint couldn't read the `session_id` from the request body due to parameter type mismatch in FastAPI
2. **No token = No Authorization header** - Without a valid session token stored, all subsequent API calls failed authentication
3. **Backend correctly rejected unauthenticated requests** - The `/api/analyze-voice` endpoint properly validated tokens, but there was no token to validate

The fix ensures the session token is properly created, stored, and sent with every API request.
