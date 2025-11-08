# apps/api/app/main.py

import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# Import your routers
from app.routers.health import router as health_router
from app.routers.format import router as format_router
from app.routers.download import router as download_router

# Import logger
from app.utils.logger import get_logger

# -----------------------------------------------------------
# 1. App initialization
# -----------------------------------------------------------
app = FastAPI(title="PaperPolish API", version="0.1.0")

# -----------------------------------------------------------
# 2. CORS middleware (for frontend dev)
# -----------------------------------------------------------
origins = os.getenv("ALLOW_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------
# 3. Logger setup
# -----------------------------------------------------------
logger = get_logger()

# -----------------------------------------------------------
# 4. Logging middleware
# -----------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware to log every request duration, path, and status.
    Always returns response even if an error occurs.
    """
    start_time = time.time()
    response = None
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        raise
    finally:
        duration = int((time.time() - start_time) * 1000)
        ua = request.headers.get("user-agent", "-")
        ip = request.client.host if request.client else "-"
        status = response.status_code if response else "ERR"
        logger.info(
            f'{request.method} {request.url.path} '
            f'status={status} time={duration}ms ua="{ua}" ip={ip}'
        )

# -----------------------------------------------------------
# 5. Routers
# -----------------------------------------------------------
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(format_router, prefix="", tags=["format"])
app.include_router(download_router, prefix="/download", tags=["download"])

# -----------------------------------------------------------
# 6. Root route (for quick check)
# -----------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    return {"name": "PaperPolish API", "version": "0.1.0"}

# -----------------------------------------------------------
# 7. Health fallback (if /health route misconfigured)
# -----------------------------------------------------------
@app.get("/health", include_in_schema=False)
def root_health():
    return {"ok": True}
