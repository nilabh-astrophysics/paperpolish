# main.py — flat repo layout (all .py in repo root)
import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# local imports — NO "app." prefix in a flat layout
from health import router as health_router
from format import router as format_router
from compile import router as compile_router
from download import router as download_router
from events import router as events_router  # if you created /events

# optional logger utility (safe to keep even if no-op)
try:
    from logger import get_logger
    logger = get_logger()
except Exception:  # pragma: no cover
    logger = None

app = FastAPI(title="PaperPolish API", version="0.1.0")

# --- CORS ---
origins = os.getenv("ALLOW_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Lightweight access logging middleware (optional) ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
        return response
    finally:
        if logger:
            ms = int((time.time() - start) * 1000)
            ua = request.headers.get("user-agent", "-")
            ip = request.client.host if request.client else "-"
            logger.info(
                f'http method={request.method} path="{request.url.path}" '
                f'status={getattr(response, "status_code", "-")} '
                f'ip={ip} ua="{ua}" duration_ms={ms}'
            )

# --- Routers ---
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(format_router, prefix="", tags=["format"])
app.include_router(compile_router, prefix="/compile", tags=["compile"])
app.include_router(download_router, prefix="/download", tags=["download"])
app.include_router(events_router, prefix="/events", tags=["events"])

# --- Root ---
@app.get("/")
def root():
    return {"name": "PaperPolish API", "version": "0.1.0"}

