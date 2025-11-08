from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from store import get_zip
import os

router = APIRouter()

@router.get("/{job_id}")
def download_zip(job_id: str):
    zip_path = get_zip(job_id)
    if not zip_path or not os.path.isfile(zip_path):
        raise HTTPException(status_code=404, detail="File not found")
    filename = f"{job_id}.zip"
    return FileResponse(zip_path, media_type="application/zip", filename=filename)

