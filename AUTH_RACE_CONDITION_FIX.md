# Authentication Race Condition Fix

## Problem
Users were being created multiple times (1-3 times) and sessions were being created 2-10 times when signing up. This was caused by multiple race conditions in both frontend and backend.

## Root Causes

### 1. Frontend Race Condition
- Both `initializeAuth()` and `handleDeepLink()` could process the same `session_id` simultaneously
- No deduplication mechanism to prevent multiple concurrent calls to `processSessionId()`
- React Native's `Linking.getInitialURL()` and `Linking.addEventListener('url')` can both fire for the same deep link

### 2. Backend Race Condition
- No idempotency check - same `session_id` could be processed multiple times
- Check-then-insert pattern for user creation (race condition window)
- No check if session already exists before creating new one
- No unique database constraints to prevent duplicates

## Fixes Applied

### Backend Fixes (`backend/auth.py`)

1. **Idempotency Check for Sessions**
   - Check if session already exists before creating
   - If session exists, return existing user data immediately

2. **Safe User Creation**
   - Try to insert user, catch duplicate key errors
   - If duplicate, fetch existing user
   - Handles race conditions gracefully

3. **Idempotent Session Creation**
   - Use `update_one` with `upsert=True` instead of `insert_one`
   - Prevents duplicate sessions even if called multiple times

### Frontend Fixes (`frontend/app/context/AuthContext.tsx`)

1. **Processing Lock**
   - Added `processingLockRef` to prevent concurrent processing
   - Added `processingRef` to track which `session_id` is being processed

2. **Deduplication in `processSessionId()`**
   - Check if already processing before starting
   - Check if processing the same `session_id`
   - Release lock in `finally` block

3. **Deduplication in `handleDeepLink()`**
   - Check if already processing before processing new deep link
   - Prevents duplicate processing when both `initializeAuth` and `handleDeepLink` fire

### Database Fixes (`backend/migrations/add_unique_indexes.py`)

1. **Unique Indexes**
   - `users.email` - unique constraint
   - `users.id` - unique constraint  
   - `user_sessions.session_token` - unique constraint

2. **Performance Indexes**
   - `user_sessions.user_id` - for faster lookups
   - `user_sessions.expires_at` - TTL index to auto-delete expired sessions

## How to Apply the Fixes

### 1. Run the Migration Script
```bash
cd backend
python migrations/add_unique_indexes.py
```

This will create the unique indexes in your MongoDB database. It's safe to run multiple times - it will skip indexes that already exist.

### 2. Deploy Backend Changes
The backend changes in `auth.py` are already applied. Just restart your backend server.

### 3. Deploy Frontend Changes
The frontend changes in `AuthContext.tsx` are already applied. Rebuild and deploy your app.

## Testing

After applying fixes, test the following scenarios:

1. **Normal Signup Flow**
   - Sign up with a new account
   - Verify only 1 user is created in database
   - Verify only 1 session is created

2. **Rapid Multiple Clicks**
   - Click signup button multiple times rapidly
   - Should still create only 1 user and 1 session

3. **Deep Link Handling**
   - Sign up and return via deep link
   - Verify no duplicate processing

4. **Concurrent Requests**
   - Open app in multiple tabs/devices simultaneously
   - Each should create only 1 session

## Verification Queries

Check for duplicates in MongoDB:

```javascript
// Check for duplicate users
db.users.aggregate([
  { $group: { _id: "$email", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for duplicate sessions for a user
db.user_sessions.aggregate([
  { $group: { _id: "$user_id", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for duplicate session tokens
db.user_sessions.aggregate([
  { $group: { _id: "$session_token", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

## Cleanup Existing Duplicates

If you have existing duplicate users/sessions, you can clean them up:

```javascript
// Remove duplicate users (keep the oldest one)
db.users.aggregate([
  { $group: { _id: "$email", docs: { $push: "$$ROOT" }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
]).forEach(function(group) {
  // Sort by created_at, keep first, delete rest
  group.docs.sort((a, b) => a.created_at - b.created_at);
  const toKeep = group.docs[0]._id;
  group.docs.slice(1).forEach(doc => {
    db.users.deleteOne({ _id: doc._id });
  });
});

// Remove duplicate sessions (keep the most recent one)
db.user_sessions.aggregate([
  { $group: { _id: "$session_token", docs: { $push: "$$ROOT" }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
]).forEach(function(group) {
  // Sort by created_at, keep last, delete rest
  group.docs.sort((a, b) => b.created_at - a.created_at);
  const toKeep = group.docs[0]._id;
  group.docs.slice(1).forEach(doc => {
    db.user_sessions.deleteOne({ _id: doc._id });
  });
});
```

## Prevention

The fixes ensure:
- ✅ Idempotent operations (safe to call multiple times)
- ✅ Database-level constraints (unique indexes)
- ✅ Application-level deduplication (processing locks)
- ✅ Graceful error handling (duplicate key errors handled)

This should completely eliminate the duplicate user and session creation issue.

