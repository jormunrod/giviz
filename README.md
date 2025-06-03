# GIVIZ

## Getting Started

### Prerequisites

- Python 3.12
- Node.js 23
- npm 11

### Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend/giviz-frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8000`.
