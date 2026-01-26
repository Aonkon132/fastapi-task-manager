from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

# Priority level enum matching the model
class PriorityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# --- TASK SCHEMAS ---

# This schema is used when creating a new task. 
# User doesn't send owner_id; the backend gets it from the JWT token.
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[PriorityLevel] = PriorityLevel.MEDIUM
    due_date: Optional[datetime] = None
    category: Optional[str] = None

# This schema is used for returning data to the user.
# It now includes 'owner_id' to show who the task belongs to.
class TaskRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_completed: bool
    priority: PriorityLevel
    due_date: Optional[datetime] = None
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    owner_id: int 

# This schema is used for updating existing tasks.
# All fields are optional to allow partial updates (PATCH).
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    priority: Optional[PriorityLevel] = None
    due_date: Optional[datetime] = None
    category: Optional[str] = None


# --- USER SCHEMAS ---

# This schema is used for returning user information.
# We never include the password/hashed_password here for security.
class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr

# This is used for receiving user data during registration.
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str # Plain text password from user, will be hashed in backend