import os
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlmodel import Session, select
from typing import List
from contextlib import asynccontextmanager
from datetime import datetime

# Imports for handling frontend static files
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Custom file imports
from .database import engine, create_db_and_tables, get_session
from .models import Task, User
from .auth import router as auth_router
from .routers import users as users_router
from .schemas import TaskCreate, TaskRead, TaskUpdate
from .security import get_current_user

# Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Define absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

@asynccontextmanager 
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
    print("Cleaning up resources...")

app = FastAPI(lifespan=lifespan)

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS Configuration for Security
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (can restrict later for production)
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://ui-avatars.com"
    return response

app.include_router(auth_router)
app.include_router(users_router.router)

@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    error_msg = exc.errors()[0]['msg']
    return JSONResponse(
        status_code=422,
        content={"detail": error_msg},
    )

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def read_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if not os.path.exists(index_path):
        return {"error": "index.html not found"}
    return FileResponse(index_path)

# --- PROTECTED CRUD Operations ---

# CREATE: Automatically link the task to the current logged-in user
@app.post("/tasks/", response_model=TaskRead)
def create_task(
    task_input: TaskCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_task = Task(
        title=task_input.title,
        description=task_input.description,
        priority=task_input.priority,
        due_date=task_input.due_date,
        category=task_input.category,
        owner_id=current_user.id  # Links task to the user
    )
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

# STATISTICS: Get task statistics for current user
@app.get("/tasks/stats")
def get_task_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Returns statistics about the user's tasks."""
    statement = select(Task).where(Task.owner_id == current_user.id)
    tasks = session.exec(statement).all()
    
    total = len(tasks)
    completed = sum(1 for task in tasks if task.is_completed)
    pending = total - completed
    
    # Count by priority
    priority_counts = {
        "urgent": sum(1 for task in tasks if task.priority == "urgent"),
        "high": sum(1 for task in tasks if task.priority == "high"),
        "medium": sum(1 for task in tasks if task.priority == "medium"),
        "low": sum(1 for task in tasks if task.priority == "low")
    }
    
    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "by_priority": priority_counts
    }

# READ: Fixed to fetch only tasks belonging to the current user
@app.get("/tasks/", response_model=List[TaskRead])
def read_tasks(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Filter tasks where owner_id matches current_user.id
    statement = select(Task).where(Task.owner_id == current_user.id)
    tasks = session.exec(statement).all()
    return tasks

# DELETE: Fixed to ensure a user can only delete their own tasks
@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Search for the task by ID and ensure it belongs to the current user
    statement = select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized access")
    
    session.delete(task)
    session.commit()
    return {"ok": True}

# UPDATE: Fixed to ensure a user can only update their own tasks
@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int, 
    task_data: TaskUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Ensure the task exists and belongs to the current user
    statement = select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    db_task = session.exec(statement).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized access")
    
    update_data = task_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    # Update the timestamp
    db_task.updated_at = datetime.utcnow()
    
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task