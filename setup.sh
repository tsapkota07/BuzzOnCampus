#!/bin/bash
# BuzzOnCampus — One-time environment setup
# Run this from the repo root: bash setup.sh

set -e  # stop on any error

echo ""
echo "==> BuzzOnCampus Setup"
echo ""

# ── Node via nvm ──────────────────────────────────────────────────────────────
echo "[1/4] Loading nvm and switching to Node 20..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! command -v nvm &> /dev/null; then
  echo "ERROR: nvm not found. Install it first:"
  echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
  echo "  Then open a new terminal and re-run this script."
  exit 1
fi

nvm install   # reads .nvmrc (Node 20)
nvm use       # switches to Node 20
echo "Node $(node --version) active."

# ── Frontend dependencies ─────────────────────────────────────────────────────
echo ""
echo "[2/4] Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "Frontend ready."

# ── Cloud Functions dependencies ──────────────────────────────────────────────
echo ""
echo "[3/4] Installing Cloud Functions dependencies..."
cd functions
npm install
cd ..
echo "Functions ready."

# ── Python venv for seed scripts ──────────────────────────────────────────────
echo ""
echo "[4/4] Setting up Python environment for seed scripts..."
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install --quiet -r scripts/requirements.txt
echo "Python env ready."

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "==> Setup complete."
echo ""
echo "Next steps:"
echo "  1. Copy frontend/.env.example → frontend/.env and fill in Firebase config"
echo "  2. Run the frontend:  cd frontend && npm run dev"
echo "  3. Run functions locally: firebase emulators:start --only functions,firestore,auth"
echo "  4. Run seed scripts: source scripts/.venv/bin/activate && python scripts/seed_universities.py"
echo ""
