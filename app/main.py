import os
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlmodel import Session, select
from typing import List
from contextlib import asynccontextmanager

# Imports for handling frontend static files and directory mapping
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Custom file imports for database connection and data models
from .database import engine, create_db_and_tables, get_session
from .models import Task
from .schemas import TaskCreate, TaskRead, TaskUpdate

# Define absolute paths for the static directory to ensure reliability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Lifespan manager to handle startup and shutdown events
@asynccontextmanager 
async def lifespan(app: FastAPI):
    # Initialize database tables when the application starts
    create_db_and_tables()
    yield
    # Cleanup actions can be added here
    print("Cleaning up resources...")

app = FastAPI(lifespan=lifespan)

# Global Exception Handler for Pydantic ValidationErrors
# This prevents the server from logging large tracebacks and returns a clean error to the user
@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    # Extract the custom error message defined in the model validator
    error_msg = exc.errors()[0]['msg']
    return JSONResponse(
        status_code=422,
        content={"detail": error_msg},
    )

# Mount the static files directory to serve CSS and JavaScript
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Root Route: Serves the main index.html file to the browser
@app.get("/")
async def read_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if not os.path.exists(index_path):
        return {"error": "index.html not found"}
    return FileResponse(index_path)

# --- CRUD Operations ---

# CREATE: Add a new task to the database
@app.post("/tasks/", response_model=TaskRead)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    # Validate the input task data against the Task model rules
    db_task = Task.model_validate(task) 
    session.add(db_task)
    session.commit()
    session.refresh(db_task) # Refresh to get the generated ID from the database
    return db_task

# READ: Fetch all tasks from the database
@app.get("/tasks/", response_model=List[TaskRead])
def read_tasks(session: Session = Depends(get_session)):
    tasks = session.exec(select(Task)).all()
    return tasks

# DELETE: Remove a specific task using its unique ID
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        # Return 404 error if the task ID does not exist
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(task)
    session.commit()
    return {"ok": True}

# UPDATE: Partially update task details using the PATCH method
@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, task_data: TaskUpdate, session: Session = Depends(get_session)):
    db_task = session.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Convert input data to dictionary, ignoring values that were not provided
    update_data = task_data.model_dump(exclude_unset=True)
    
    # Iterate and update each field dynamically
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task