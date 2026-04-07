# CVector Industrial Dashboard

A plant monitoring dashboard built with **React + Ant Design**, **FastAPI**, and **PostgreSQL**.

![Dashboard](screenshots/final_ui.png)

## Quick Start

Prerequisites: [Docker](https://docs.docker.com/get-docker/) and Docker Compose.

```bash
git clone <repo-url>
cd cvector_industrial_dashboard
docker compose up --build
```

Open http://localhost:3000 to view the dashboard.

## Services

The system runs four Docker containers:

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| `db` | PostgreSQL 16 | 5432 | Database - schema auto-created via `init.sql` on first run |
| `backend` | Python FastAPI | 8000 | REST API - docs at http://localhost:8000/docs |
| `frontend` | Node + Vite | 3000 | React dashboard - hot reloads in dev via volume mount |
| `live-data` | Python script | - | Seeds 24h of historical data, then inserts new readings every 30s |

### Managing individual services

Rebuild a single service after code changes:
```bash
docker compose up --build backend -d
```

Pause/unpause a service without restarting (preserves state):
```bash
docker compose pause live-data
docker compose unpause live-data
```

Stop/start a service (re-runs the container command on start):
```bash
docker compose stop live-data
docker compose start live-data
```

View logs for a specific service:
```bash
docker compose logs backend
docker compose logs live-data --follow
```

## Stopping

```bash
docker compose down
```

To fully reset the database and start fresh:

```bash
docker compose down -v
docker compose up --build
```

The `-v` flag removes the database volume, wiping all data. Without it, data persists across restarts.

## Architecture

```
Facility (1) → (many) Assets (1) → (many) Sensor Readings
```

- **Database**: PostgreSQL with three tables - `facilities`, `assets`, `sensor_readings`
- **Backend**: Python FastAPI with SQLAlchemy ORM, serving REST endpoints with filtering by facility, asset, metric, and time range
- **Frontend**: React + TypeScript + Vite + Ant Design + Recharts, with auto-polling and localStorage persistence

The frontend polls the backend every 10 seconds for live data. All facility, asset, and metric discovery is dynamic - the frontend has no hardcoded knowledge of what exists in the database. New facilities, assets, or metric types added to the backend are automatically picked up by the frontend without code changes or restarts.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/facilities` | List all facilities |
| GET | `/api/facilities/:id` | Facility details with assets |
| GET | `/api/assets?facility_id=` | List assets, filterable by facility |
| GET | `/api/readings?facility_id=&asset_id=&metric_name=&start_time=&end_time=` | Sensor readings with filters |
| GET | `/api/readings/metrics/:asset_id` | List available metric names for an asset |
| GET | `/api/dashboard/summary/:facility_id` | Aggregated latest metrics for a facility |

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Ant Design, Recharts
- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: PostgreSQL
- **Infrastructure**: Docker Compose

Total hours of work: ~4

Environment variables (such as DB URL) are hard-coded for the sake of the prototype.
