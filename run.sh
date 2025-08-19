#!/bin/bash

echo "What do you want to run?"
echo "1) Backend (Django)"
echo "2) Frontend (Vite + React)"
echo "3) Check flake8 issues (Python code style)"
read -p "Choose (1/2/3): " choice

if [ "$choice" == "1" ]; then
  echo "Starting backend..."
  cd backend || exit

  # Create virtual environment if not exists
  if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
  fi

  source venv/bin/activate

  # Install dependencies if needed
  if ! pip show Django &> /dev/null; then
    echo "Installing requirements..."
    pip install -r requirements.txt
  fi

  python manage.py migrate
  python manage.py runserver

elif [ "$choice" == "2" ]; then
  echo "Starting frontend..."
  cd frontend/giviz-frontend || exit

  # Install npm dependencies if missing
  if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
  fi

  npm run dev

elif [ "$choice" == "3" ]; then
  echo "Checking flake8 issues..."
  cd backend || exit
  source venv/bin/activate
  flake8 api

else
  echo "Invalid choice. Pick 1, 2, or 3, hotshot."
  exit 1
fi