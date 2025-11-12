# format.py
import os
import tempfile
import zipfile
import subprocess
import shutil
import uuid

from fastapi import APIRouter, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from jobs import save_job_record

router = APIRouter()

# Supported templates
TEMPLATES = ["aastex", "mnras", "apj"]

@router.post("/format")
async def format_paper(archive: UploadFile, template: str = Form("aastex")):
    """
    Accept a zip archive of a LaTeX paper, apply formatting template,
    and return a reference to the processed file.
    """
    if template not in TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Unsupported template: {template}")

    job_id = str(uuid.uuid4())

    with tempfile.TemporaryDirectory() as tmpdir:
        # Save uploaded file
        input_path = os.path.join(tmpdir, "input.zip")
        output_path = os.path.join(tmpdir, f"{job_id}.zip")

        with open(input_path, "wb") as f:
            shutil.copyfileobj(archive.file, f)

        # Extract, process, and re-zip
        with zipfile.ZipFile(input_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        # Example format command (replace with real formatting logic)
        try:
            subprocess.run(["echo", f"Formatting with {template}"], check=True)
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Formatting failed: {e}")

        shutil.make_archive(output_path.replace(".zip", ""), "zip", tmpdir)

        # Save job record
        save_job_record(job_id, template, output_path)

        download_url = f"/download/{job_id}"

        return JSONResponse({
            "ok": True,
            "message": f"Formatting successful with {template}",
            "job_id": job_id,
            "template": template,
            "download_url": download_url,
        })
