from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from pydantic import field_validator, EmailStr
from datetime import datetime
from enum import Enum
import re

# Enum for task priority levels
class PriorityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# 1. User Model
class User(SQLModel, table=True):
    """
    Represents a user in the system.
    One user can own many tasks.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True) 
    email: EmailStr = Field(unique=True)
    hashed_password: str
    
    # Relationship: Connects tasks to this user
    # 'back_populates' creates a link to the 'owner' field in Task model
    tasks: List["Task"] = Relationship(back_populates="owner")


# 2. Task Model
class Task(SQLModel, table=True):
    """
    Represents a task item.
    Each task must belong to a specific owner (User).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    is_completed: bool = Field(default=False)
    
    # New fields for enhanced task management
    priority: PriorityLevel = Field(default=PriorityLevel.MEDIUM)
    due_date: Optional[datetime] = None
    category: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Foreign Key: Stores the ID of the user who owns this task
    owner_id: int = Field(foreign_key="user.id", nullable=False)

    # Relationship: Allows accessing user info directly from a task object
    owner: Optional[User] = Relationship(back_populates="tasks")

    @field_validator("title")
    @classmethod
    def validate_title(cls, value):
        # Relaxed validator - allows more characters including punctuation
        if not value or len(value.strip()) == 0:
            raise ValueError("Title cannot be empty")
        if len(value) > 200:
            raise ValueError("Title must be less than 200 characters")
        return value.strip()