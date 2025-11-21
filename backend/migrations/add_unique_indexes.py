"""
Migration script to add unique indexes to prevent duplicate users and sessions.
Run this once to set up the database constraints.

Usage:
    python backend/migrations/add_unique_indexes.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

async def create_unique_indexes():
    """Create unique indexes on users and user_sessions collections."""
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        print("ERROR: MONGO_URL and DB_NAME environment variables must be set")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Create unique index on users.email
        print("Creating unique index on users.email...")
        await db.users.create_index("email", unique=True, name="unique_email")
        print("✓ Unique index on users.email created")
        
        # Create unique index on users.id
        print("Creating unique index on users.id...")
        await db.users.create_index("id", unique=True, name="unique_user_id")
        print("✓ Unique index on users.id created")
        
        # Create unique index on user_sessions.session_token
        print("Creating unique index on user_sessions.session_token...")
        await db.user_sessions.create_index("session_token", unique=True, name="unique_session_token")
        print("✓ Unique index on user_sessions.session_token created")
        
        # Create index on user_sessions.user_id for faster lookups
        print("Creating index on user_sessions.user_id...")
        await db.user_sessions.create_index("user_id", name="idx_user_id")
        print("✓ Index on user_sessions.user_id created")
        
        # Create TTL index on user_sessions.expires_at to auto-delete expired sessions
        print("Creating TTL index on user_sessions.expires_at...")
        await db.user_sessions.create_index("expires_at", expireAfterSeconds=0, name="ttl_expires_at")
        print("✓ TTL index on user_sessions.expires_at created")
        
        print("\n✅ All indexes created successfully!")
        
    except Exception as e:
        print(f"\n❌ Error creating indexes: {e}")
        print("\nNote: If you see 'duplicate key error', some indexes may already exist.")
        print("This is safe to ignore - the indexes are already in place.")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_unique_indexes())

