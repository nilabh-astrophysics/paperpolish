# health.py
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import time
import os
import sqlite3

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Minimal health endpoint used by Render (and other platforms).
    Returns 200 quickly when service is up.
    Also performs a very small optional check:
      - make sure DB file path (if set) is accessible (non-blocking)
      - returns service version if provided in env
    Keeps it light to avoid slowing startup.
    """
    # Optional quick checks (non-fatal) - adapt or remove as needed
    info = {"status": "ok", "timestamp": int(time.time())}

    # attach simple DB check if you use sqlite (non-blocking)
    db_path = os.getenv("JOBS_DB", "/tmp/paperpolish_jobs.db")
    try:
        # only try if file exists
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path, timeout=1)
            conn.execute("SELECT 1")
            conn.close()
            info["db"] = "ok"
        else:
            info["db"] = "not_present"
    except Exception as e:
        # do not return failure for DB errors — just note them
        info["db"] = f"error: {str(e)[:120]}"

    # optional version tag from env
    info["version"] = os.getenv("SERVICE_VERSION", "unknown")

    return JSONResponse(info)
