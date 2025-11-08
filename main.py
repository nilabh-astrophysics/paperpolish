# main.py — flat layout for Render

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import time

# your routers live as top-level files: health.py, format.py, compile.py, download.py, events.py
from health import router as health_router
from format import router as format_router
from compile import router as compile_router
from download import router as download_router
# comment out if you didn't add events yet:
# from events import router as events_router

# optional: tiny logger (uses stdout on Render)
def get_logger():
    import logging, sys
    logger = logging.getLogger("paperpolish")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
        logger.addHandler(handler)
    logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))
    return logger

logger = get_logger()

app = FastAPI(title="PaperPolish API", version="0.1.0")

# CORS
origins = os.getenv("ALLOW_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# simple request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
        status = response.status_code
        return response
    finally:
        ms = int((time.time() - start) * 1000)
        ua = request.headers.get("user-agent", "-")
        ip = request.client.host if request.client else "-"
        logger.info(f"{request.method} {request.url.path} {status} {ms}ms ua=\"{ua}\" ip={ip}")

# routers
app.include_router(health_router,  prefix="/health",  tags=["health"])
app.include_router(format_router,  prefix="/format",  tags=["format"])
app.include_router(compile_router, prefix="/compile", tags=["compile"])
app.include_router(download_router, prefix="/download", tags=["download"])
# If you added it:
# app.include_router(events_router, prefix="/events", tags=["events"])

@app.get("/")
def root():
    return {"name": "PaperPolish API", "version": "0.1.0"}

