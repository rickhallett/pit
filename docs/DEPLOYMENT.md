# The Pit — Deployment Guide

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Anthropic API key
- PostgreSQL database (Railway for production, Docker for local)

### Local Development

1. **Start PostgreSQL:**
   ```bash
   docker compose up -d
   ```

2. **Set up backend:**
   ```bash
   cd be
   cp .env.example .env
   # Edit .env with your ANTHROPIC_API_KEY
   source .venv/bin/activate
   python -m flask --app pit_api.app run
   ```

3. **Set up frontend:**
   ```bash
   cd fe
   npm install
   npm run dev
   ```

### Production with Docker

1. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build and start:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

3. **With local PostgreSQL (testing):**
   ```bash
   docker compose -f docker-compose.prod.yml --profile postgres up -d --build
   ```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-api03-...` |
| `DATABASE_URL` | Database connection | See below |

### Database URLs

**Local PostgreSQL:**
```
postgresql://pit:pit@localhost:5432/pit
```

**Docker PostgreSQL:**
```
postgresql://pit:pit@postgres:5432/pit
```

**Railway (production):**
```
postgresql://user:password@host.railway.app:5432/railway
```

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | API bind address |
| `PORT` | `5000` | API port |
| `DEBUG` | `false` | Debug mode (never in prod) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | API URL for frontend |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                   NGINX                      │
│              (reverse proxy)                 │
│           pit.cloud / thepit.cloud           │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│   Frontend    │   │     API       │
│   (Next.js)   │   │  (FastAPI)    │
│   Port 3000   │   │   Port 8000   │
└───────────────┘   └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Database    │
                    │ (PostgreSQL)  │
                    └───────────────┘
```

---

## Railway Setup (Production)

1. **Create Railway project:**
   - Go to [railway.app](https://railway.app)
   - Create new project → Add PostgreSQL

2. **Get connection URL:**
   - Click on PostgreSQL service → Variables tab
   - Copy `DATABASE_URL`

3. **Deploy backend:**
   - Connect your GitHub repo
   - Set root directory to `be/`
   - Add environment variables: `ANTHROPIC_API_KEY`, `DATABASE_URL`

4. **Run migrations:**
   ```bash
   railway run alembic upgrade head
   ```

---

## Healthchecks

**API:**
```bash
curl http://localhost:5000/health
# {"status": "healthy"}
```

**Frontend:**
```bash
curl http://localhost:3000/
# HTML response
```

---

## Monitoring

### Docker Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
```

### Container Status

```bash
docker compose -f docker-compose.prod.yml ps
```

---

## Troubleshooting

### API won't start

1. Check `ANTHROPIC_API_KEY` is set
2. Check `DATABASE_URL` is valid
3. Check logs: `docker compose logs api`

### Frontend can't reach API

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check API is healthy: `curl http://api:5000/health` (from frontend container)
3. Check Docker network: `docker network inspect pit_default`

### Database connection issues

1. For local PostgreSQL: ensure `--profile postgres` is used
2. For Railway: verify connection credentials are current
3. Run migrations: `cd be && alembic upgrade head`

---

## Security Checklist

- [ ] `DEBUG=false` in production
- [ ] Strong `POSTGRES_PASSWORD` if using local PostgreSQL
- [ ] Anthropic API key stored securely (not in git)
- [ ] HTTPS enabled via reverse proxy
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
