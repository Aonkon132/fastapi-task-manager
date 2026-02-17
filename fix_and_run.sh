#!/bin/bash
echo "Stopping any running servers..."
pkill -f uvicorn

echo "Creating new virtual environment in /tmp/venv_tm to avoid permission issues..."
rm -rf /tmp/venv_tm
python3 -m venv /tmp/venv_tm
source /tmp/venv_tm/bin/activate

echo "Installing dependencies..."
pip install --no-cache-dir -r requirements.txt

echo "Starting server..."
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
