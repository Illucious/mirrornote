from datetime import datetime, timezone
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

class UsageService:
    """
    Manages user usage limits and subscription plans
    Free: 5 assessments total
    Standard (₹499/month): 30 assessments per month
    """
    
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.plans = {
            "free": {
                "max_assessments": 500,
                "is_monthly": False  # Total limit, not monthly
            },
            "standard": {
                "max_assessments": 30,
                "is_monthly": True
            }
        }
    
    async def check_can_create_assessment(self, user_id: str) -> dict:
        """
        Check if user can create a new assessment based on their plan
        Returns: {"allowed": bool, "reason": str, "usage": dict}
        """
        # Get user subscription
        user = await self.db.users.find_one({"id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Determine plan
        is_premium = user.get("isPremium", False)
        plan_type = "standard" if is_premium else "free"
        plan = self.plans[plan_type]
        
        # Get assessment count
        if plan["is_monthly"]:
            # Count assessments this month for premium users
            start_of_month = datetime.now(timezone.utc).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            count = await self.db.assessments.count_documents({
                "user_id": user_id,
                "created_at": {"$gte": start_of_month}
            })
        else:
            # Count total assessments for free users
            count = await self.db.assessments.count_documents({
                "user_id": user_id
            })
        
        usage = {
            "used": count,
            "limit": plan["max_assessments"],
            "plan": plan_type
        }
        
        if count >= plan["max_assessments"]:
            return {
                "allowed": False,
                "reason": f"You've reached your {plan_type} plan limit of {plan['max_assessments']} assessments{'per month' if plan['is_monthly'] else ''}. Please upgrade to continue.",
                "usage": usage
            }
        
        return {
            "allowed": True,
            "reason": "",
            "usage": usage
        }
    
    async def get_user_usage(self, user_id: str) -> dict:
        """
        Get current usage statistics for a user
        """
        user = await self.db.users.find_one({"id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        is_premium = user.get("isPremium", False)
        plan_type = "standard" if is_premium else "free"
        plan = self.plans[plan_type]
        
        # Get counts
        if plan["is_monthly"]:
            start_of_month = datetime.now(timezone.utc).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            monthly_count = await self.db.assessments.count_documents({
                "user_id": user_id,
                "created_at": {"$gte": start_of_month}
            })
            total_count = await self.db.assessments.count_documents({
                "user_id": user_id
            })
            
            return {
                "plan": plan_type,
                "monthly_used": monthly_count,
                "monthly_limit": plan["max_assessments"],
                "total_assessments": total_count,
                "remaining": max(0, plan["max_assessments"] - monthly_count)
            }
        else:
            total_count = await self.db.assessments.count_documents({
                "user_id": user_id
            })
            
            return {
                "plan": plan_type,
                "used": total_count,
                "limit": plan["max_assessments"],
                "total_assessments": total_count,
                "remaining": max(0, plan["max_assessments"] - total_count)
            }
