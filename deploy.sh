#!/bin/bash
# Deploy json-editor on VPS
# Usage: ssh user@server 'bash -s' < deploy.sh
#   or:  copy to server and run: bash deploy.sh

set -e

APP_DIR="/opt/json-editor"
REPO="https://github.com/GalinaErshova/json-editor.git"
BRANCH="main"

echo "==> Deploying json-editor..."

# Install Docker if missing
if ! command -v docker &> /dev/null; then
  echo "==> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo "Docker installed. You may need to re-login for group changes."
fi

# Clone or pull
if [ -d "$APP_DIR/.git" ]; then
  echo "==> Pulling latest code..."
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  echo "==> Cloning repository..."
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER:$USER" "$APP_DIR"
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# Build and run
echo "==> Building and starting container..."
docker compose up -d --build

echo ""
echo "==> Done! App is running at http://$(hostname -I | awk '{print $1}'):3000"
