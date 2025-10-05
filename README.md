# GIVIZ

## Overview

GIVIZ is a full-stack web application that combines a Django REST backend with a Vite + React frontend. This repository contains everything you need to develop, run, and test both parts of the stack locally.

## Prerequisites

Make sure the following tooling is available on your machine:

- Python 3.12 (with `python3` and `pip` on your PATH)
- Node.js 23 (ships with npm 11)
- Bash shell (for running helper scripts)

> Tip: On macOS you can install Python and Node.js via Homebrew: `brew install python@3.12 node@23`.

## Quick Start (Recommended)

Use the interactive helper script to bootstrap the project components without memorising individual commands.

```bash
chmod +x run.sh   # first time only
./run.sh
```

The script prints a menu with the following options:

1. **Backend (Django)** – Creates/activates `backend/venv`, installs requirements, runs migrations, and launches the development server on `http://localhost:8000/`.
2. **Frontend (Vite + React)** – Installs frontend dependencies if needed and starts the dev server on `http://localhost:5173/` (Vite default).
3. **Check flake8 issues** – Lints the backend Python codebase.
4. **Backend unit tests** – Runs pytest with coverage reporting for the backend.
5. **Backend + Frontend** – Launches both servers at once (backend first, then frontend). Press `Ctrl+C` in the terminal to stop everything.

The script is safe to re-run; it will reuse the existing Python virtual environment and `node_modules` directory when present.

## Manual Setup (Optional)

If you prefer to work without the helper script, follow the manual instructions below.

### Backend (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend serves the API at `http://localhost:8000/`.

### Frontend (Vite + React)

```bash
cd frontend/giviz-frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:5173/` by default.
