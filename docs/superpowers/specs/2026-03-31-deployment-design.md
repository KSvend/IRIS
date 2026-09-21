# IRIS Deployment Design

**Date:** 2026-03-31
**Status:** Draft
**Approach:** Vercel (frontend) + Render (backend)

## Overview

Deploy IRIS as a split-service architecture: Next.js frontend on Vercel free tier, FastAPI backend on Render free tier. Supabase remains the database and auth provider. GitHub Actions workflows are unchanged.

Target: small team (2-5 people), cost $0/month hosting, downtime-tolerant.

## 1. Credential Security

### Problem

Real API keys (Anthropic, Supabase service key, B4P, Tavily) exist in `.env` files in the working tree. These must be removed and rotated.

### Actions

- Delete `.env` files from the working tree (root and backend)
- Keep only `backend/.env.example` with placeholder values
- Rotate all exposed keys: Anthropic, Supabase (anon + service), B4P, Tavily
- Store all secrets in Vercel and Render dashboards (environment variables)
- GitHub Actions secrets remain as-is (already using `${{ secrets.* }}`)
- Local development: each developer creates their own `.env` from `.env.example`

## 2. Frontend Deployment (Vercel)

### Setup

- Connect GitHub repo to Vercel
- Framework preset: Next.js (auto-detected)
- Root directory: `/` (Next.js app is at repo root)
- Build command: `next build` (default)
- Auto-deploys on push to `main`
- Preview deploys on feature branches

### Environment Variables (Vercel Dashboard)

- `NEXT_PUBLIC_API_URL` — Render backend URL (e.g., `https://iris-api.onrender.com`)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key

### Authentication (Supabase Auth)

- Invite-only: accounts created manually in Supabase dashboard
- No signup page exposed
- Login page: email + password
- Next.js middleware checks for valid Supabase session on all `/(dashboard)` routes
- Unauthenticated users redirected to `/login`
- Supabase JS client (`@supabase/supabase-js`) handles session tokens and refresh

## 3. Backend Deployment (Render)

### Setup

- Connect GitHub repo to Render as a Web Service
- Docker deployment using existing `backend/Dockerfile`
- Root directory: `/` (Dockerfile uses `COPY backend/requirements.txt` and `COPY . .` — expects repo root as build context)
- Dockerfile path: `backend/Dockerfile`
- Port: 7860 (already configured in Dockerfile)
- Auto-deploys on push to `main`

### Environment Variables (Render Dashboard)

- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_JWT_SECRET`
- `TAVILY_API_KEY`
- `B4P_API_KEY`

### Free Tier Constraints

- **RAM:** 512MB. FastAPI + uvicorn + sentence-transformers embedding model (~90MB runtime). Tight but should fit with lazy loading.
- **Cold starts:** Container sleeps after 15min idle. First request after sleep takes ~30-60s. Acceptable for this team size.

### API Security (Three Layers)

1. **CORS** — `backend/app.py` origins updated to include Vercel domain (currently `["https://ksvend.github.io"]`)
2. **B4P_API_KEY** — static API key sent as `X-API-Key` header. Simple first gate against bots/scrapers.
3. **Supabase JWT verification** — frontend sends user's Supabase session token as `Authorization: Bearer <token>`. Backend verifies using `PyJWT` + `SUPABASE_JWT_SECRET`. Provides per-user identity and revokable access.

Frontend sends both headers on every backend API call:

```
X-API-Key: <B4P_API_KEY>
Authorization: Bearer <supabase_session_token>
```

Backend middleware checks both before processing any request.

## 4. GitHub Actions Workflows

No changes needed. The 6 existing workflows (research, monitor, health, stats, ingestion x2) run on GitHub Actions and write directly to Supabase — none call the backend API. They already use `${{ secrets.* }}` for credentials.

## 5. Deployment Pipeline

```
Push to main → Vercel auto-deploys frontend
             → Render auto-deploys backend (Docker build)
```

- `main` = production
- Feature branches: Vercel creates preview deploys; backend changes tested locally before merging
- Rollback: one-click in both Vercel and Render dashboards

### Local Development

Unchanged:

- `start-dev.sh` for frontend (Next.js dev server)
- `uvicorn backend.app:app` for backend
- Local `.env` files created from `.env.example`, never committed

## 6. Codebase Changes Required

| File | Change |
|------|--------|
| `backend/app.py` | Replace CORS `["*"]` with Vercel domain. Add Supabase JWT verification middleware. |
| `backend/requirements.txt` | Add `PyJWT` |
| `backend/config.py` | Add `SUPABASE_JWT_SECRET` env var |
| `backend/.env.example` | Add `SUPABASE_JWT_SECRET` placeholder |
| `app/` (frontend) | Add `@supabase/supabase-js`, login page, auth middleware for `/(dashboard)` routes |
| `app/api/*` | Send Supabase session token + B4P_API_KEY with backend API calls |
| `.env` (root) | Delete from working tree |
| `backend/.env` | Delete from working tree |

### No Changes To

- GitHub Actions workflows (unless they call backend API directly)
- Database schema (`supabase/schema.sql`)
- Agents (`backend/agents/`)
- Tools (`backend/tools/`)
- Monitoring pipeline (`monitoring/`)

## 7. Cost Summary

| Service | Cost |
|---------|------|
| Vercel (frontend) | $0 (free tier) |
| Render (backend) | $0 (free tier) |
| Supabase (database + auth) | $0 (free tier) |
| GitHub Actions | $0 (free for public repos / 2000 min for private) |
| **Total hosting** | **$0/month** |
| API usage (Anthropic + Tavily + Apify) | ~$3-4/day (unchanged) |

## 8. Upgrade Path

If the team grows or cold starts become a problem:

- **Render Starter ($7/mo):** No cold starts, 2GB RAM, custom domains
- **Vercel Pro ($20/mo):** Password protection, more bandwidth, analytics
- **Supabase Pro ($25/mo):** More storage, daily backups, email templates
