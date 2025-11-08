# store.py
import os
import uuid
import shutil

# Where ZIPs are persisted inside the container
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
