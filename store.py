# store.py
import os
import uuid
import shutil
import json

# Directory for saving job metadata and ZIPs
DATA_DIR = os.environ.get("DATA_DIR", "/app/data")
os.makedirs(DATA_DIR, exist_ok=True)

def put_zip(zip_path: str, job_id: str | None = None) -> tuple[str, str]:
    """
    Save a generated ZIP into DATA_DIR.
    Returns (job_id, saved_path).
    """
    if job_id is None:
        job_id = str(uuid.uuid4())
    dest = os.path.join(DATA_DIR, f"{job_id}.zip")
    shutil.copyfile(zip_path, dest)
    return job_id, dest

def get_zip(job_id: str) -> str | None:
    """
    Return absolute path to a stored ZIP by job_id, or None if missing.
    """
    path = os.path.join(DATA_DIR, f"{job_id}.zip")
    return path if os.path.isfile(path) else None

def save_job(job_id: str, data: dict):
    """
    Save metadata (e.g. job parameters, status) as JSON.
    """
    path = os.path.join(DATA_DIR, f"{job_id}.json")
    with open(path, "w") as f:
        json.dump(data, f)

def load_job(job_id: str) -> dict | None:
    """
    Load saved job metadata if available.
    """
    path = os.path.join(DATA_DIR, f"{job_id}.json")
    if not os.path.isfile(path):
        return None
    with open(path, "r") as f:
        return json.load(f)
