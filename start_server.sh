#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Set environment variables
export SECRET_KEY="5fdb766a9d88f7c01f93e3f710a7f9d520330ff6ee5376446b146783c6081cca"
export DATABASE_URL="sqlite:///./database.db"
export ACCESS_TOKEN_EXPIRE_MINUTES="30"
export ENVIRONMENT="development"

# Run uvicorn
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
