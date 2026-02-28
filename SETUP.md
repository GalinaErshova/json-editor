# JSON Editor — Setup & Deployment Guide

Standalone JSON editor with tree navigator, syntax validation, and optional JSON Schema support.

## Project Structure

```
scenario-editor/
├── app/
│   ├── page.tsx                    # Main editor page
│   ├── editor.module.css           # Editor styles
│   ├── globals.css                 # Design tokens
│   └── api/scenarios/
│       └── validate/route.ts       # POST /api/scenarios/validate
├── components/editor/
│   ├── json-editor.tsx             # CodeMirror 6 wrapper
│   ├── scenario-preview.tsx        # Universal JSON tree navigator
│   └── validation-panel.tsx        # Errors/warnings panel
├── lib/
│   └── validator.ts                # JSON syntax + AJV schema validator
├── Dockerfile                      # Multi-stage production build
├── docker-compose.yml              # One-command deploy
└── package.json
```

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3001

## Features

- **Upload / New / Download** — work with JSON files locally (no server storage)
- **CodeMirror 6** — syntax highlighting, line numbers, bracket matching, search
- **Tree Navigator** — collapsible key hierarchy for any JSON structure
- **Validation** — JSON syntax check; optional JSON Schema validation via AJV
- **JSON Schema** — upload a `.schema.json` file, then Validate checks data against it

## Deploy to VPS with Docker

### Prerequisites

- Linux VPS (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed

If Docker is not installed:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 1. Copy project to server

```bash
# From your local machine:
scp -r . user@your-server:/opt/json-editor
```

Or clone from git:
```bash
git clone <your-repo-url> /opt/json-editor
cd /opt/json-editor
```

### 2. Build and run

```bash
cd /opt/json-editor
docker compose up -d --build
```

The app will be available at `http://your-server:3000`

### 3. Set up reverse proxy (optional, for HTTPS)

With Nginx:
```nginx
server {
    listen 80;
    server_name editor.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then add HTTPS with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d editor.yourdomain.com
```

### Management Commands

```bash
# View logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

## Build without Docker

```bash
npm run build
npm start
```

Runs on port 3001 by default (configurable in package.json).

## API

### POST /api/scenarios/validate

```json
{
  "data": { ... },
  "schema": { ... }   // optional JSON Schema
}
```

Response:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```
