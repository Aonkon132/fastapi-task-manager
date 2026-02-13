from sqlmodel import create_engine, SQLModel, Session
from fastapi import Depends
import os

# Get the base directory (project root)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The connection URL that tells SQLModel where and how to connect to the database
# Using /tmp directory to bypass macOS permission issues in the project folder
sqlite_file_name = "task_manager.db"
import tempfile
sqlite_url = f"sqlite:///{os.path.join(tempfile.gettempdir(), sqlite_file_name)}"

# The engine is the "bridge" that handles the communication between Python and SQLite
# check_same_thread: False is required for SQLite to work with FastAPI's asynchronous nature
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

# Function to physically create the database file and all defined tables
def create_db_and_tables():
    # Looks at all classes that inherit from SQLModel and creates them in the database
    SQLModel.metadata.create_all(engine)

# Dependency function to manage database sessions for each request
def get_session():
    # Using 'with' ensures the session is automatically closed after the task is done
    with Session(engine) as session:
        # 'yield' provides the session to the FastAPI endpoint and pauses until the request finishes
        yield session