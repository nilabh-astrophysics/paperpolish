# jobs.py
import os
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

# Persistent job store file
JOB_STORE = os.getenv("JOB_STORE", "/tmp/jobs.json")

def _load_jobs():
    if not os.path.exists(JOB_STORE):
        return {}
    with open(JOB_STORE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def _save_jobs(jobs):
    with open(JOB_STORE, "w") as f:
        json.dump(jobs, f)

def save_job_record(job_id: str, template: str, output_path: str):
    jobs = _load_jobs()
    jobs[job_id] = {
        "template": template,
        "output_path": output_path,
        "status": "done"
    }
    _save_jobs(jobs)

@router.get("/jobs")
def list_jobs():
    jobs = _load_jobs()
    return JSONResponse({"ok": True, "jobs": jobs})

@router.get("/jobs/{job_id}")
def get_job(job_id: str):
    jobs = _load_jobs()
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job["download_url"] = f"/download/{job_id}"
    return JSONResponse({"ok": True, "job_id": job_id, **job})
