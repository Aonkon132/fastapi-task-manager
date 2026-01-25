import os
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from contextlib import asynccontextmanager

# Imports for handling frontend static files
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Custom file imports (Using relative imports)
from .database import engine, create_db_and_tables, get_session
from .models import Task
from .schemas import TaskCreate, TaskRead, TaskUpdate

# 1. Setup absolute paths for the static folder
# This ensures the app finds the 'static' directory regardless of where the server is started
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

@asynccontextmanager 
async def lifespan(app: FastAPI):
    # Create database tables on startup
    create_db_and_tables()
    yield
    print("Cleaning up resources...")

app = FastAPI(lifespan=lifespan)

# 2. Mount static files (For CSS, JS, Images)
# Maps the 'app/static' folder to the '/static' URL path
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# 3. Root Route - Serves the index.html file
@app.get("/")
async def read_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if not os.path.exists(index_path):
        return {"error": f"index.html not found at {index_path}. Please verify your static folder."}
    return FileResponse(index_path)

# --- CRUD Operations ---

# CREATE: Add a new task
@app.post("/tasks/", response_model=TaskRead)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    db_task = Task.model_validate(task) 
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

# READ: Get a list of all tasks
@app.get("/tasks/", response_model=List[TaskRead])
def read_tasks(session: Session = Depends(get_session)):
    tasks = session.exec(select(Task)).all()
    return tasks

# DELETE: Remove a task by ID
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(task)
    session.commit()
    return {"ok": True}

# UPDATE: Modify an existing task (Partial update using PATCH)
@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int, 
    task_data: TaskUpdate, 
    session: Session = Depends(get_session)
):
    db_task = session.get(Task, task_id)
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Convert input data to dictionary, excluding fields that were not sent
    update_data = task_data.model_dump(exclude_unset=True)
    
    # Dynamically update only the fields provided by the user
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    
    return db_task


















