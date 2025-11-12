# main.py
import logging
import sys
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("paperpolish")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
logger.addHandler(handler)

app = FastAPI(title="PaperPolish API")

# CORS - allow your frontend origins during testing (update in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to exact origin(s) in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attempt to import and mount known routers gracefully
def try_include(module_name: str, variable_name: str = "router"):
    """
    Try to import module_name and include the attribute variable_name if present.
    Returns True if included; False otherwise.
    """
    try:
        mod = __import__(module_name, fromlist=[variable_name])
        router = getattr(mod, variable_name, None)
        if router is not None:
            app.include_router(router)
            logger.info(f"Including router from {module_name}.{variable_name}")
            return True
        else:
            logger.warning(f"{module_name} has no attribute {variable_name}")
            return False
    except Exception as e:
        logger.info(f"Could not import {module_name}: {e}")
        return False

# Try to include the commonly present routers
try_include("health")     # optional: health.py -> router
try_include("format")     # expected: format.py -> router (defines /format)
try_include("jobs")       # jobs.py -> router (prefix '/jobs')
try_include("download")   # optional: download.py -> router (defines /download/{job_id})
# If you add other routers (store, etc.) add try_include("store") etc.

# Provide a fallback download endpoint if there's no download router
@app.get("/download/{job_id}")
def fallback_download(job_id: str):
    """
    Basic fallback so format.py's constructed download_url works even if you
    haven't added a dedicated download router. In a production app you'd serve
    the saved zip or redirect to the store URL.
    """
    # Simple informational response — replace with actual file serving if you implement it.
    return JSONResponse({"ok": False, "detail": "Download route not implemented on this instance", "job_id": job_id})

@app.get("/")
def root(request: Request):
    base = str(request.base_url).rstrip("/")
    return JSONResponse({"ok": True, "message": "PaperPolish API running", "base_url": base})

# Global exception handler — convert to JSON friendly messages
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTPException: {exc.detail}")
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse({"detail": "Internal server error"}, status_code=500)

if __name__ == "__main__":
    # Local run helper: uvicorn main:app --reload --host 0.0.0.0 --port 8000
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
