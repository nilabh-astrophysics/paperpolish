# jobs.py
import os
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()
STORE_PATH = "/tmp/paperpolish_jobs.json"

def _load():
    if not os.path.exists(STORE_PATH):
        return {}
    try:
        with open(STORE_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def _save(jobs):
    with open(STORE_PATH, "w") as f:
        json.dump(jobs, f)

def save_job_record(job_id: str, template: str, output_path: str, extra: dict = None):
    jobs = _load()
    jobs[job_id] = {
        "id": job_id,
        "template": template,
        "output_path": output_path,
        "status": "done",
    }
    if extra:
        jobs[job_id].update(extra)
    _save(jobs)

@router.get("/jobs")
def list_jobs():
    jobs = _load()
    return JSONResponse({"ok": True, "jobs": jobs})

@router.post("/jobs")
def create_job(job: dict):
    jobs = _load()
    job_id = job.get("id")
    if not job_id:
        raise HTTPException(status_code=400, detail="Job must have an id")
    jobs[job_id] = job
    _save(jobs)
    return {"ok": True, "status": "saved", "job_id": job_id}

@router.get("/jobs/{job_id}")
def get_job(job_id: str):
    jobs = _load()
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"ok": True, "job_id": job_id, **job}
