# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Rules

- **Always ask clarifying questions** before starting work if requirements are unclear or ambiguous.
- **Always push changes to GitHub** after completing any task (`git push`).

## Project Overview

MP3 Tag Editor — a self-hosted web app for bulk-editing ID3 tags on a music library. FastAPI backend + React/Vite frontend, deployed via Docker Compose. The music directory is mounted read-write into the container at `/music`.

## Development Commands

### Docker (recommended)

```bash
MUSIC_DIR=/path/to/music docker compose up
```

Frontend: http://localhost:5173 · Backend: http://localhost:8000 · API docs: http://localhost:8000/docs

### Backend (local)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
ALLOWED_ROOT=/path/to/music uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Run tests:
```bash
cd backend
pytest                        # all tests
pytest tests/test_tag_writer.py  # single file
pytest -k "test_write_tags"      # single test
```

Lint:
```bash
ruff check .
ruff format .
```

### Frontend (local)

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Architecture

### Backend (`backend/`)

- **`main.py`** — FastAPI app, CORS middleware, mounts `/api/v1` router
- **`app/config.py`** — Pydantic settings from env vars (see `.env.example`)
- **`app/dependencies.py`** — In-memory file registry: scan populates `{file_id → abs_path}`, all write ops look up paths here. `file_id` = first 16 hex chars of SHA-256 of the path.
- **`app/utils/path_guard.py`** — Every path is resolved and checked to be under `ALLOWED_ROOT` before any filesystem operation. Never bypass this.
- **`app/api/`** — One module per feature: `files`, `tags`, `rename`, `musicbrainz`, `backup`
- **`app/services/`** — Business logic: `tag_reader`, `tag_writer` (mutagen), `rename_service`, `musicbrainz_service`, `backup_service`
- **`app/models/`** — Pydantic models shared across layers: `file_info.py` (core domain), `requests.py`, `responses.py`

Key design: **null-means-skip** — `TagData` fields are all `Optional`; a `None` value means "leave existing tag unchanged". Only non-`None` fields are written.

ID3 version enum: `id3v1.1`, `id3v2.3`, `id3v2.4`, `none`. Default should be `id3v2.4`.

Streaming scan: `GET /api/v1/files/scan-stream` returns SSE events (`{type: "file", ...}` and `{type: "done", ...}`). Max depth 5, max files 5000 (configurable).

### Frontend (`frontend/src/`)

- **`store/fileStore.ts`** — Zustand store for the scanned file list and multi-selection state
- **`store/uiStore.ts`** — Zustand store for active panel (`tags | batch-tags | rename | musicbrainz | null`) and toasts
- **`store/tagStore.ts`** — Zustand store for tag edit state
- **`api/`** — One module per backend route group. `filesApi.ts` contains both the axios-based methods and the `scanStream` SSE reader (uses raw `fetch` for streaming)
- **`components/layout/AppShell.tsx`** — Top-level layout: sidebar (folder browse + tree + scan progress), main area (panel + file table + selection toolbar). Panel rendered via `activePanel` from uiStore.
- **`components/tags/`** — `TagEditor` (single file), `BatchTagEditor` (multi-select), `DryRunDiff`, `ID3VersionSelector`
- **`components/files/`** — `FolderTree`, `FileTable`, `FileRow`, `SelectionToolbar`, `ScanProgressBar`
- **`components/rename/`** — Template and regex rename, preview table
- **`components/musicbrainz/`** — MusicBrainz search + batch apply panel

API base URL is set via `VITE_API_BASE_URL` env var (falls back to `http://localhost:8000`).

## Environment Variables

### Backend (`.env` or Docker env)

| Variable | Default | Description |
|---|---|---|
| `ALLOWED_ROOT` | `/music` | Filesystem jail for all file operations |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins (JSON array) |
| `MUSICBRAINZ_USER_AGENT` | `MP3TagEditor/1.0 (...)` | Required by MusicBrainz API ToS |
| `MAX_SCAN_DEPTH` | `5` | Max directory recursion depth |
| `MAX_SCAN_FILES` | `5000` | Cap on scan results |

### Frontend

| Variable | Default |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` |
