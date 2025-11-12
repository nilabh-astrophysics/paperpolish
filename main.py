# main.py
from __future__ import annotations

import os
from typing import List, Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# ------------------------------------------------------------
# App
# ------------------------------------------------------------
app = FastAPI(title="PaperPolish API", version="0.1.0")

# CORS: comma-separated list in ALLOW_ORIGINS (empty means "*")
def _parse_origins(env_val: str | None) -> List[str]:
    if not env_val:
        return ["*"]
    items = [s.strip() for s in env_val.split(",")]
    return [it for it in items if it]

origins = _parse_origins(os.getenv("ALLOW_ORIGINS"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# Lightweight request logging (optional but helpful)
# Safe: handles case where call_next raises before response is assigned.
# ------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    path = request.url.path
    response = None
    try:
        response = await call_next(request)
        return response
    finally:
        # Render/other providers show stdout in logs
        status = getattr(response, "status_code", "?")
        print(f"{request.method} {path} -> {status}")

# ------------------------------------------------------------
# Routers (each import is optional)
# Keep names as if files are `health.py`, `format.py`, etc.
# If a file/route is missing, the app still starts cleanly.
# ------------------------------------------------------------
health_router = None
format_router = None
compile_router = None
download_router = None
events_router = None
jobs_router = None

try:
    from health import router as health_router  # type: ignore
    print("health router imported")
except Exception as e:
    health_router = None
    print(f"health router not imported: {e}")

try:
    from format import router as format_router  # type: ignore
    print("format router imported")
except Exception as e:
    format_router = None
    print(f"format router not imported: {e}")

try:
    from compile import router as compile_router  # type: ignore
    print("compile router imported")
except Exception as e:
    compile_router = None
    print(f"compile router not imported: {e}")

try:
    from download import router as download_router  # type: ignore
    print("download router imported")
except Exception as e:
    download_router = None
    print(f"download router not imported: {e}")

try:
    from events import router as events_router  # type: ignore
    print("events router imported")
except Exception as e:
    events_router = None
    print(f"events router not imported: {e}")

# If you added the tiny Jobs API (optional)
try:
    from jobs import router as jobs_router  # type: ignore
    print("jobs router imported")
except Exception as e:
    jobs_router = None
    print(f"jobs router not imported: {e}")

# Mount what exists (all under /api)
if health_router:
    app.include_router(health_router, prefix="/api")
    print("mounted health router at /api")
else:
    print("no health router mounted")

if format_router:
    app.include_router(format_router, prefix="/api")
    print("mounted format router at /api")
else:
    print("no format router mounted")

if compile_router:
    app.include_router(compile_router, prefix="/api")
    print("mounted compile router at /api")
else:
    print("no compile router mounted")

if download_router:
    app.include_router(download_router, prefix="/api")
    print("mounted download router at /api")
else:
    print("no download router mounted")

if events_router:
    app.include_router(events_router, prefix="/api")
    print("mounted events router at /api")
else:
    print("no events router mounted")

if jobs_router:
    app.include_router(jobs_router, prefix="/api")
    print("mounted jobs router at /api")
else:
    print("no jobs router mounted")

# ------------------------------------------------------------
# Always-available health endpoint (fallback)
# (keeps uptime checks valid even if health router is absent)
# ------------------------------------------------------------
@app.get("/api/health")
async def health_fallback():
    return {"ok": True, "service": "paperpolish-api"}

# Render (platform) expects /health by default in many setups.
# Provide both GET and HEAD for /health so internal checks succeed.
@app.get("/health", include_in_schema=False)
async def render_health_get():
    return {"ok": True, "service": "paperpolish-api"}

@app.head("/health", include_in_schema=False)
async def render_health_head():
    # FastAPI will return 200 for HEAD; empty body is okay for health probe.
    return

# Some providers may probe the root with HEAD; explicitly accept HEAD on "/"
@app.get("/")
async def root():
    return {"name": "PaperPolish API", "docs": "/docs", "health": "/api/health"}

@app.head("/", include_in_schema=False)
async def head_root():
    # Empty 200 response for HEAD /
    return

# ------------------------------------------------------------
# Error normalization
# ------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exc_handler(_: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail or "HTTP error", "code": exc.status_code},
    )
