"""Authentication utilities for the API"""

from fastapi import HTTPException, Depends, Header
from typing import Optional
import os
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from root directory
load_dotenv(dotenv_path="../../../.env")

# JWT configuration - requires secure secret in production
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY or SECRET_KEY == "your_super_secure_jwt_secret_at_least_32_characters_long":
    raise ValueError(
        "JWT_SECRET environment variable is required and must be properly configured. "
        "Please set a secure 32+ character secret in your .env file."
    )
ALGORITHM = "HS256"

async def verify_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify JWT token from Authorization header.
    
    In production, this would validate against Supabase Auth.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # In production, verify with Supabase
        # For now, decode a simple JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        return user_id
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def create_test_token(user_id: str) -> str:
    """Create a test JWT token (development only)"""
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow()
    }
    
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)