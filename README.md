# Scenario Editor

Standalone JSON editor for History's Edge scenarios.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3001

## Features

- JSON editor with CodeMirror 6 (syntax highlighting, linting)
- Live preview of scenario structure
- JSON Schema validation with AJV
- File management (create, edit, save, delete)
- Click elements in preview to jump to JSON source

## Project Structure

```
scenario-editor/
├── app/                  # Next.js pages
│   ├── page.tsx         # Home
│   ├── scenarios/       # Scenarios list
│   ├── editor/[fileId]/ # Editor page
│   └── api/scenarios/   # REST API
├── components/editor/   # React components
├── lib/                 # Validation & file I/O
├── types/              # TypeScript types
└── scenarios/          # JSON scenario files
```

## API

- `GET /api/scenarios` - List all scenarios
- `GET /api/scenarios/:id` - Get scenario JSON
- `POST /api/scenarios` - Create new scenario
- `PUT /api/scenarios/:id` - Update scenario
- `DELETE /api/scenarios/:id` - Delete scenario
- `POST /api/scenarios/validate` - Validate JSON

## Development

Place your scenario JSON files in `scenarios/` directory.

Example: `scenarios/my-scenario.json`

Then edit at: http://localhost:3001/editor/my-scenario

## Build

```bash
npm run build
npm start
```

## Extracted from History's Edge

This is a standalone extraction. Removed:
- Game engine (processTurn, checkTriggers)
- Real history simulation
- Admin auth & database
- Graph viewer

Kept:
- Full structural validation
- ID reference checking
- Turn routing validation
- All UI components
