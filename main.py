# main.py — PaperPolish API (flat repo layout)
import os
import time
from time import time as now

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# ───────────── Routers (flat layout: files in repo root) ─────────────
# Keep these imports as-is if your files are named health.py, format.py, etc.
# If a router is missing, we degrade gracefully with placeholders.
try:
    from health import router as health_router
except Exception:
    health_router = None

try:
    from format import router as format_router
except Exception:
    format_router = None

try:
    from compile import router as compile_router
except Exception:
    compile_router = None

try:
    from download import router as download_router
except Exception:
    download_router = None

try:
    from events import router as events_router
except Exception:
    events_router = None

# Optional logger utility
try:
    from logger import get_logger
    logger = get_logger()
except Exception:  # pragma: no cover
    logger = None

app = FastAPI(title="PaperPolish API", version="1.0.0")

# ───────────── CORS ─────────────
# ALLOW_ORIGINS can be comma-separated, e.g.:
# "https://paperpolish.vercel.app,https://your-custom-domain.com"
_allow_env = os.getenv("ALLOW_ORIGINS", "").strip()
if _allow_env:
    ALLOW_ORIGINS = [o.strip() for o in _allow_env.split(",") if o.strip()]
else:
    # Safe defaults for local + prod
    ALLOW_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000", "https://paperpolish.vercel.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    # Also allow Vercel preview deployments like https://paperpolish-git-*.vercel.app
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ───────────── Limits (rate + size) ─────────────
RATE_LIMIT = int(os.getenv("RATE_LIMIT", "30"))          # requests per window
RATE_WINDOW_SEC = int(os.getenv("RATE_WINDOW_SEC", "60"))
MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "25"))
MAX_UPLOAD_BYTES = int(MAX_UPLOAD_MB * 1024 * 1024)

# In-memory per-process bucket (use Redis for multi-instance)
_rate_bucket = {}  # key: f"{ip}:{window}" -> count

@app.middleware("http")
async def rate_and_size_limits(request: Request, call_next):
    # 1) Per-IP rate limit (very lightweight)
    ip = request.client.host if request.client else "anonymous"
    window = int(now() // RATE_WINDOW_SEC)
    key = f"{ip}:{window}"
    _rate_bucket[key] = _rate_bucket.get(key, 0) + 1
    if _rate_bucket[key] > RATE_LIMIT:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests — please try again in a minute."},
        )

    # 2) Upload size guard (Content-Length) for /format
    if request.method.upper() == "POST" and request.url.path.rstrip("/") == "/format":
        cl = request.headers.get("content-length")
        try:
            if cl and int(cl) > MAX_UPLOAD_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"File too large. Max {MAX_UPLOAD_MB:.0f} MB."},
                )
        except Exception:
            # If Content-Length is missing or malformed, let downstream handler decide.
            pass

    # 3) Access log
    started = time.time()
    try:
        response = await call_next(request)
        return response
    finally:
        if logger:
            dur_ms = int((time.time() - started) * 1000)
            ua = request.headers.get("user-agent", "-")
            status = getattr(locals().get("response", None), "status_code", "-")
            logger.info(
                f'http method={request.method} path="{request.url.path}" '
                f"status={status} ip={ip} ua=\"{ua}\" duration_ms={dur_ms}"
            )

# ───────────── Health ─────────────
@app.get("/health")
async def health():
    return {
        "ok": True,
        "rate_limit": RATE_LIMIT,
        "rate_window_sec": RATE_WINDOW_SEC,
        "max_upload_mb": MAX_UPLOAD_MB,
        "allow_origins": ALLOW_ORIGINS,
    }

# ───────────── Include routers (or placeholders) ─────────────
if health_router:
    app.include_router(health_router, prefix="/health", tags=["health"])

if format_router:
    app.include_router(format_router, prefix="", tags=["format"])
else:
    @app.post("/format")
    async def _format_placeholder():
        raise HTTPException(status_code=500, detail="format router not loaded")

if compile_router:
    app.include_router(compile_router, prefix="/compile", tags=["compile"])

if download_router:
    app.include_router(download_router, prefix="/download", tags=["download"])
else:
    @app.get("/download/{job_id}")
    async def _download_placeholder(job_id: str):
        raise HTTPException(status_code=500, detail="download route not available")

if events_router:
    app.include_router(events_router, prefix="/events", tags=["events"])

# ───────────── Root ─────────────
@app.get("/")
def root():
    return {"name": "PaperPolish API", "version": "1.0.0"}

# ───────────── Error handlers ─────────────
@app.exception_handler(413)
async def too_large(_request: Request, _exc: Exception):
    return JSONResponse(status_code=413, content={"detail": f"File too large. Max {MAX_UPLOAD_MB:.0f} MB."})

@app.exception_handler(429)
async def too_many(_request: Request, _exc: Exception):
    return JSONResponse(status_code=429, content={"detail": "Too many requests — please try again in a minute."})
