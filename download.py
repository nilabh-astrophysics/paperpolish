# download.py
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import jobs

router = APIRouter()

@router.get("/download/{job_id}")
def download_job(job_id: str):
    store = jobs._load()
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    path = job.get("output_path")
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Formatted file not found")
    filename = os.path.basename(path)
    # set media_type if desired: "application/zip"
    return FileResponse(path, media_type="application/zip", filename=filename)
