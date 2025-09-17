#!/bin/bash

MAGENTA="\033[35m"
CYAN="\033[36m"
YELLOW="\033[33m"
GREEN="\033[32m"
RESET="\033[0m"
BOLD="\033[1m"

print_logo() {
  printf "%b\n" "${MAGENTA}${BOLD}"
  cat <<'ASCII'
        G I V I Z
ASCII
  printf "%b\n" "${RESET}"
}

print_menu() {
  printf "%b\n" "${CYAN}${BOLD}What do you want to run?${RESET}"
  printf "%b\n" "${YELLOW}1) Backend (Django)${RESET}"
  printf "%b\n" "${YELLOW}2) Frontend (Vite + React)${RESET}"
  printf "%b\n" "${YELLOW}3) Check flake8 issues (Python code style)${RESET}"
  printf "%b\n" "${YELLOW}4) Backend unit tests (pytest + coverage)${RESET}"
  printf "%b\n" "${YELLOW}5) Backend + Frontend (double launch)${RESET}"
}

ensure_backend_env() {
  cd backend || exit
  if [ ! -d "venv" ]; then
    printf "%b\n" "${GREEN}Creating virtual environment...${RESET}"
    python3 -m venv venv
  fi

  # shellcheck source=/dev/null
  source venv/bin/activate

  if ! pip show Django &>/dev/null; then
    printf "%b\n" "${GREEN}Installing backend requirements...${RESET}"
    pip install -r requirements.txt
  fi
}

run_backend() {
  ensure_backend_env
  python manage.py migrate
  python manage.py runserver
}

run_frontend() {
  cd frontend/giviz-frontend || exit
  if [ ! -d "node_modules" ]; then
    printf "%b\n" "${GREEN}Installing npm packages...${RESET}"
    npm install
  fi
  npm run dev
}

run_flake8() {
  ensure_backend_env
  flake8 api
}

run_backend_tests() {
  ensure_backend_env
  pytest --cov=api --cov-report=term-missing --cov-report=html api/tests
}

run_double_launch() {
  ensure_backend_env
  python manage.py migrate
  python manage.py runserver &
  BACKEND_PID=$!

  cleanup() {
    if ps -p "${BACKEND_PID}" >/dev/null 2>&1; then
      kill "${BACKEND_PID}" 2>/dev/null || true
      wait "${BACKEND_PID}" 2>/dev/null || true
    fi
  }

  trap cleanup EXIT INT TERM

  if [ -n "${VIRTUAL_ENV:-}" ]; then
    deactivate
  fi
  cd .. || exit
  cd frontend/giviz-frontend || exit
  if [ ! -d "node_modules" ]; then
    printf "%b\n" "${GREEN}Installing npm packages...${RESET}"
    npm install
  fi
  npm run dev
}

print_logo
print_menu
read -rp "Choose (1/2/3/4/5): " choice

case "$choice" in
  1)
    printf "%b\n" "${CYAN}Starting backend...${RESET}"
    run_backend
    ;;
  2)
    printf "%b\n" "${CYAN}Starting frontend...${RESET}"
    run_frontend
    ;;
  3)
    printf "%b\n" "${CYAN}Checking flake8 issues...${RESET}"
    run_flake8
    ;;
  4)
    printf "%b\n" "${CYAN}Running backend unit tests...${RESET}"
    run_backend_tests
    ;;
  5)
    printf "%b\n" "${CYAN}Launching backend and frontend...${RESET}"
    run_double_launch
    ;;
  *)
    printf "%b\n" "${MAGENTA}Invalid choice. Pick 1, 2, 3, 4, or 5, hotshot.${RESET}"
    exit 1
    ;;
 esac
