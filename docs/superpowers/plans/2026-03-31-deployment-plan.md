# IRIS Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy IRIS (Next.js + FastAPI) to Vercel + Render free tiers with Supabase Auth and proper credential security.

**Architecture:** Split deployment — Next.js frontend on Vercel, FastAPI backend on Render (Docker), Supabase for database + auth. Three-layer API security: CORS, API key, Supabase JWT verification.

**Tech Stack:** Next.js, FastAPI, Supabase Auth, PyJWT, `@supabase/supabase-js`, `@supabase/ssr`

**Spec:** `docs/superpowers/specs/2026-03-31-deployment-design.md`

---

## File Structure

### Files to Create

- `app/login/page.tsx` — Login page (email + password form)
- `app/middleware.ts` — Next.js middleware for Supabase Auth session checks
- `lib/supabase/client.ts` — Browser Supabase client (singleton)
- `lib/supabase/server.ts` — Server-side Supabase client (for API routes/middleware)
- `lib/supabase/middleware.ts` — Helper to refresh Supabase session in middleware
- `backend/auth.py` — Supabase JWT verification dependency for FastAPI

### Files to Modify

- `backend/app.py` — Update CORS origins, replace `verify_api_key` with JWT + API key auth
- `backend/config.py` — Add `SUPABASE_JWT_SECRET`
- `backend/requirements.txt` — Add `PyJWT`
- `backend/.env.example` — Add `SUPABASE_JWT_SECRET` placeholder
- `app/api/annotate/route.ts` — Forward Supabase session token to backend
- `package.json` — Add `@supabase/supabase-js`, `@supabase/ssr`

### Files to Delete

- `.env` (root) — Contains real Anthropic API key
- `backend/.env` — Contains real Supabase + Anthropic keys

---

## Task 1: Clean Up Credentials

**Files:**
- Delete: `.env` (root)
- Delete: `backend/.env`
- Modify: `backend/.env.example`

- [ ] **Step 1: Update `.env.example` with all required variables**

Add the missing `SUPABASE_JWT_SECRET` and `B4P_API_KEY` entries to `backend/.env.example`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard
ANTHROPIC_API_KEY=sk-ant-...
B4P_API_KEY=your-api-key
TAVILY_API_KEY=tvly-...
```

- [ ] **Step 2: Delete `.env` files from working tree**

```bash
rm /Users/kmini/Github/IRIS/.env
rm /Users/kmini/Github/IRIS/backend/.env
```

- [ ] **Step 3: Verify `.gitignore` covers `.env`**

Check that `.gitignore` includes `.env` (it should already). If not, add it.

```bash
grep -n "\.env" /Users/kmini/Github/IRIS/.gitignore
```

Expected: a line matching `.env` or `*.env`.

- [ ] **Step 4: Create root `.env.example` for frontend variables**

Create `.env.example` at repo root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
IRIS_BACKEND_URL=http://localhost:7860
B4P_API_KEY=your-api-key
```

- [ ] **Step 5: Commit**

```bash
git add backend/.env.example .env.example .gitignore
git commit -m "chore: clean up credentials, add env examples for all services"
```

**Note:** After this task, the user must manually:
1. Rotate all exposed keys (Anthropic, Supabase, B4P, Tavily) via their respective dashboards
2. Create fresh local `.env` files from the examples for continued development

---

## Task 2: Backend JWT Auth Middleware

**Files:**
- Create: `backend/auth.py`
- Modify: `backend/config.py`
- Modify: `backend/requirements.txt`
- Test: `backend/tests/test_auth.py`

- [ ] **Step 1: Add `PyJWT` to requirements**

Add to `backend/requirements.txt` after the Supabase section:

```
# Auth
PyJWT==2.9.0
```

- [ ] **Step 2: Add `SUPABASE_JWT_SECRET` to config**

In `backend/config.py`, add after line 11 (`API_KEY = ...`):

```python
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
```

- [ ] **Step 3: Write failing test for JWT auth**

Create `backend/tests/test_auth.py`:

```python
"""Tests for Supabase JWT + API key authentication."""

import time
import jwt
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient


# Fake JWT secret for testing
TEST_JWT_SECRET = "test-secret-key-at-least-32-chars-long!!"


def _make_token(sub="user-123", exp_offset=3600, secret=TEST_JWT_SECRET):
    """Create a valid Supabase-style JWT for testing."""
    payload = {
        "sub": sub,
        "aud": "authenticated",
        "exp": int(time.time()) + exp_offset,
        "iat": int(time.time()),
        "role": "authenticated",
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_valid_request_passes_auth():
    from backend.auth import verify_request
    from fastapi import Request

    token = _make_token()
    # Test the verification function directly
    result = verify_request(
        api_key="test-api-key",
        authorization=f"Bearer {token}",
    )
    assert result["sub"] == "user-123"


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_missing_api_key_rejected():
    from backend.auth import verify_request
    from fastapi import HTTPException

    token = _make_token()
    with pytest.raises(HTTPException) as exc_info:
        verify_request(api_key="", authorization=f"Bearer {token}")
    assert exc_info.value.status_code == 401


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_missing_jwt_rejected():
    from backend.auth import verify_request
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        verify_request(api_key="test-api-key", authorization="")
    assert exc_info.value.status_code == 401


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_expired_jwt_rejected():
    from backend.auth import verify_request
    from fastapi import HTTPException

    token = _make_token(exp_offset=-3600)  # expired 1 hour ago
    with pytest.raises(HTTPException) as exc_info:
        verify_request(api_key="test-api-key", authorization=f"Bearer {token}")
    assert exc_info.value.status_code == 401


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_wrong_api_key_rejected():
    from backend.auth import verify_request
    from fastapi import HTTPException

    token = _make_token()
    with pytest.raises(HTTPException) as exc_info:
        verify_request(api_key="wrong-key", authorization=f"Bearer {token}")
    assert exc_info.value.status_code == 401
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd /Users/kmini/Github/IRIS && python -m pytest backend/tests/test_auth.py -v
```

Expected: FAIL — `backend.auth` module does not exist.

- [ ] **Step 5: Implement `backend/auth.py`**

Create `backend/auth.py`:

```python
"""Supabase JWT + API key verification for FastAPI."""

import jwt
from fastapi import HTTPException, Header

from backend.config import API_KEY, SUPABASE_JWT_SECRET


def verify_request(
    api_key: str = Header("", alias="X-API-Key"),
    authorization: str = Header("", alias="Authorization"),
) -> dict:
    """Verify both API key and Supabase JWT. Returns decoded JWT payload."""
    # Check API key
    if not api_key or api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Check JWT
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/kmini/Github/IRIS && python -m pytest backend/tests/test_auth.py -v
```

Expected: all 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/auth.py backend/tests/test_auth.py backend/config.py backend/requirements.txt
git commit -m "feat: add Supabase JWT + API key auth middleware for backend"
```

---

## Task 3: Wire Auth Into FastAPI Endpoints

**Files:**
- Modify: `backend/app.py`

- [ ] **Step 1: Update CORS origins**

In `backend/app.py`, replace lines 32-37:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ksvend.github.io"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

With:

```python
import os

_cors_origins = [
    "https://ksvend.github.io",
]
# Add Vercel deployment URL when available
_vercel_url = os.environ.get("VERCEL_FRONTEND_URL", "")
if _vercel_url:
    _cors_origins.append(_vercel_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] **Step 2: Replace `verify_api_key` with `verify_request`**

In `backend/app.py`, replace the import and dependency:

Replace line 11:
```python
from backend.config import API_KEY
```
With:
```python
from backend.auth import verify_request
```

Replace the entire `verify_api_key` function (lines 80-92) and the rate limit variables (lines 39-41) with nothing — delete them.

Update all endpoint signatures that use `_=Depends(verify_api_key)` to use `user=Depends(verify_request)` instead. These are on lines: 210, 246, 260, 282, 307, 337, 352, 389, 423, 439, 457, 489.

For example, change:
```python
async def chat(req: ChatRequest, _=Depends(verify_api_key)):
```
To:
```python
async def chat(req: ChatRequest, user=Depends(verify_request)):
```

- [ ] **Step 3: Keep `/health` endpoint unauthenticated**

The `/health` endpoint (line 189) does NOT use `Depends(verify_api_key)` — it stays as-is with no auth. Same for `/debug/headers` (line 203).

- [ ] **Step 4: Run existing tests to check nothing broke**

```bash
cd /Users/kmini/Github/IRIS && python -m pytest backend/tests/ -v
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app.py
git commit -m "feat: wire JWT auth into all protected endpoints, update CORS for Vercel"
```

---

## Task 4: Frontend Supabase Auth Setup

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Modify: `package.json` (add dependencies)

- [ ] **Step 1: Install Supabase packages**

```bash
cd /Users/kmini/Github/IRIS && npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create browser Supabase client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Create server Supabase client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Create middleware helper**

Create `lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/api/") &&
    request.nextUrl.pathname !== "/health"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/ package.json package-lock.json
git commit -m "feat: add Supabase Auth client setup for browser, server, and middleware"
```

---

## Task 5: Next.js Auth Middleware & Login Page

**Files:**
- Create: `middleware.ts` (repo root — required by Next.js)
- Create: `app/login/page.tsx`

- [ ] **Step 1: Create Next.js middleware**

Create `middleware.ts` at the **repo root** (not inside `app/`):

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, favicon.ico, public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Create login page**

Create `app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      background: "#f5f5f5",
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem" }}>IRIS Login</h1>

        {error && (
          <p style={{ color: "red", fontSize: "0.875rem", margin: "0 0 1rem" }}>
            {error}
          </p>
        )}

        <label style={{ display: "block", marginBottom: "1rem" }}>
          <span style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "1.5rem" }}>
          <span style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: loading ? "#999" : "#333",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts app/login/
git commit -m "feat: add Next.js auth middleware and login page"
```

---

## Task 6: Forward Auth Token in API Routes

**Files:**
- Modify: `app/api/annotate/route.ts`

- [ ] **Step 1: Read current annotate route**

Read `app/api/annotate/route.ts` to confirm the current fetch pattern.

- [ ] **Step 2: Update annotate route to forward Supabase session token**

The annotate route currently sends `X-API-Key`. Update it to also forward the user's Supabase session token from the request cookies.

Replace the fetch headers in both GET and POST handlers:

```typescript
import { createClient } from "@/lib/supabase/server";

// Inside each handler, before the fetch call:
const supabase = await createClient();
const { data: { session } } = await supabase.auth.getSession();

// Update fetch headers:
headers: {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
  "Authorization": `Bearer ${session?.access_token ?? ""}`,
},
```

- [ ] **Step 3: Commit**

```bash
git add app/api/annotate/route.ts
git commit -m "feat: forward Supabase auth token from API routes to backend"
```

---

## Task 7: Render Docker Build Configuration

**Files:**
- Modify: `backend/Dockerfile`
- Create: `render.yaml` (optional — Render Blueprint for reproducible config)

- [ ] **Step 1: Verify Dockerfile works with Render's expectations**

The current Dockerfile at `backend/Dockerfile` expects to be built from repo root:

```dockerfile
COPY backend/requirements.txt requirements.txt
COPY . .
```

For Render, we need to set:
- **Root directory:** (empty — repo root)
- **Dockerfile path:** `backend/Dockerfile`
- **Docker context:** `.` (repo root)

No Dockerfile changes needed. This is a Render dashboard configuration.

- [ ] **Step 2: Add `VERCEL_FRONTEND_URL` to `.env.example`**

In `backend/.env.example`, add:

```
VERCEL_FRONTEND_URL=https://your-project.vercel.app
```

- [ ] **Step 3: Commit**

```bash
git add backend/.env.example
git commit -m "chore: add VERCEL_FRONTEND_URL to env example for CORS config"
```

---

## Task 8: Remove Debug Endpoints & Harden Health Check

**Files:**
- Modify: `backend/app.py`

- [ ] **Step 1: Remove `/debug/headers` endpoint**

Delete lines 203-205 from `backend/app.py`:

```python
@app.get("/debug/headers")
async def debug_headers(request: Request):
    """Temporary: dump request headers for debugging."""
    return {"headers": dict(request.headers)}
```

- [ ] **Step 2: Sanitize `/health` endpoint**

The health endpoint currently leaks key lengths and prefixes. Replace it with:

```python
@app.get("/health")
async def health():
    """System status check -- no auth required."""
    return {"status": "healthy"}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/kmini/Github/IRIS && python -m pytest backend/tests/ -v
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/app.py
git commit -m "security: remove debug endpoint, sanitize health check output"
```

---

## Task 9: Manual Deployment Steps (Checklist)

These are manual steps performed in browser dashboards, not code changes.

- [ ] **Step 1: Rotate all exposed API keys**
  - Anthropic: https://console.anthropic.com → API Keys → regenerate
  - Supabase: Dashboard → Settings → API → regenerate anon + service keys
  - Supabase JWT Secret: Dashboard → Settings → API → JWT Settings → copy JWT secret
  - Tavily: https://tavily.com → Dashboard → regenerate
  - B4P_API_KEY: generate a new random string (e.g., `openssl rand -hex 32`)

- [ ] **Step 2: Set up Vercel**
  - Import GitHub repo at https://vercel.com/new
  - Framework: Next.js (auto-detected)
  - Root directory: (leave empty — repo root)
  - Add environment variables:
    - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = new anon key
    - `IRIS_BACKEND_URL` = (will be set after Render deploy)
    - `B4P_API_KEY` = new API key

- [ ] **Step 3: Set up Render**
  - Create Web Service at https://dashboard.render.com/create
  - Connect GitHub repo
  - Environment: Docker
  - Root directory: (leave empty — repo root)
  - Dockerfile path: `backend/Dockerfile`
  - Add environment variables:
    - `ANTHROPIC_API_KEY` = new key
    - `SUPABASE_URL` = your Supabase project URL
    - `SUPABASE_KEY` = new anon key
    - `SUPABASE_SERVICE_KEY` = new service key
    - `SUPABASE_JWT_SECRET` = JWT secret from Supabase dashboard
    - `TAVILY_API_KEY` = new key
    - `B4P_API_KEY` = same new API key as Vercel
    - `VERCEL_FRONTEND_URL` = Vercel deployment URL (e.g., `https://iris-xyz.vercel.app`)

- [ ] **Step 4: Update Vercel with Render URL**
  - After Render deploys, copy the URL (e.g., `https://iris-api.onrender.com`)
  - In Vercel dashboard, set `IRIS_BACKEND_URL` = Render URL
  - Redeploy Vercel

- [ ] **Step 5: Update GitHub Actions secrets**
  - Go to repo Settings → Secrets → Actions
  - Update all secrets with the new rotated keys

- [ ] **Step 6: Create team user accounts in Supabase**
  - Supabase Dashboard → Authentication → Users → Invite User
  - Create accounts for each team member (email + password)

- [ ] **Step 7: Smoke test**
  - Visit Vercel URL → should redirect to `/login`
  - Log in with a created account → should see dashboard
  - Test chat, annotation, and verification features
  - Check Render logs for any errors
