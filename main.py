# main.py
from __future__ import annotations

import os
from typing import List

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
# ------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Keep it short to avoid noisy logs
    path = request.url.path
    try:
        response = await call_next(request)
        return response
    finally:
        # Render/other providers show stdout in logs
        print(f"{request.method} {path} -> {getattr(response, 'status_code', '?')}")

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
except Exception:
    health_router = None

try:
    from format import router as format_router  # type: ignore
except Exception:
    format_router = None

try:
    from compile import router as compile_router  # type: ignore
except Exception:
    compile_router = None

try:
    from download import router as download_router  # type: ignore
except Exception:
    download_router = None

try:
    from events import router as events_router  # type: ignore
except Exception:
    events_router = None

# If you added the tiny Jobs API (optional)
try:
    from jobs import router as jobs_router  # type: ignore
except Exception:
    jobs_router = None

# Mount what exists (all under /api)
if health_router:
    app.include_router(health_router, prefix="/api")
if format_router:
    app.include_router(format_router, prefix="/api")
if compile_router:
    app.include_router(compile_router, prefix="/api")
if download_router:
    app.include_router(download_router, prefix="/api")
if events_router:
    app.include_router(events_router, prefix="/api")
if jobs_router:
    app.include_router(jobs_router, prefix="/api")

# ------------------------------------------------------------
# Always-available health endpoint (fallback)
# (keeps uptime checks valid even if health router is absent)
# ------------------------------------------------------------
@app.get("/api/health")
async def health_fallback():
    return {"ok": True, "service": "paperpolish-api"}

# ------------------------------------------------------------
# Error normalization
# ------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exc_handler(_: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail or "HTTP error", "code": exc.status_code},
    )

@app.get("/")
async def root():
    return {"name": "PaperPolish API", "docs": "/docs", "health": "/api/health"}
