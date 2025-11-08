from typing import Dict, Optional
import os

# persistent folder (relative to this file)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # .../app
JOBS_DIR = os.path.join(BASE_DIR, "data", "jobs")
os.makedirs(JOBS_DIR, exist_ok=True)

# in-memory index (safe for dev)
JOB_ZIPS: Dict[str, str] = {}

def jobs_dir() -> str:
    return JOBS_DIR

def save_job(job_id: str, zip_path: str) -> None:
    JOB_ZIPS[job_id] = zip_path

def get_zip(job_id: str) -> Optional[str]:
    return JOB_ZIPS.get(job_id)
