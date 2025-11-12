# main.py
import logging
import sys
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("paperpolish")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
logger.addHandler(handler)

app = FastAPI(title="PaperPolish API")

# CORS - in production set allow_origins to your frontend URL only
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def try_include(module_name: str):
    try:
        mod = __import__(module_name, fromlist=["router"])
        if hasattr(mod, "router"):
            app.include_router(mod.router)
            logger.info(f"Included router from {module_name}")
        else:
            logger.warning(f"No router in {module_name}")
    except Exception as e:
        logger.warning(f"Could not import {module_name}: {e}")

# Import routers with no prefix so routes are available at /format, /jobs, /download, etc.
for module in ["format", "jobs"]:
    try_include(module)

# Root + health
@app.get("/")
def root():
    return {"ok": True, "message": "PaperPolish backend running"}

@app.get("/health")
def health():
    return {"ok": True, "service": "paperpolish-api"}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
