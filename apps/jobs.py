# jobs.py
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

# Temporary in-memory list (can later be moved to DB)
jobs_cache = []

@router.get("/jobs")
def list_jobs():
    """Return all jobs (fake persisted for now)."""
    return jobs_cache

@router.post("/jobs")
def create_job(job: dict):
    """Add a new job record."""
    job["id"] = str(len(jobs_cache) + 1)
    job["createdAt"] = datetime.utcnow().isoformat()
    jobs_cache.append(job)
    return {"ok": True, "job": job}

@router.delete("/jobs")
def clear_jobs():
    """Clear all jobs."""
    jobs_cache.clear()
    return {"ok": True}
