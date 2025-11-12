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

@router.post("/format")
async def format_paper(archive: UploadFile, template: str = Form("aastex")):
    if not archive.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files allowed")

    job_id = str(uuid.uuid4())

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, "input.zip")
        output_path = os.path.join(tmpdir, f"{job_id}.zip")

        with open(input_path, "wb") as f:
            shutil.copyfileobj(archive.file, f)

        with zipfile.ZipFile(input_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        # Dummy format operation (replace with real latex formatting)
        try:
            subprocess.run(["echo", f"Formatting with {template}"], check=True)
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Formatting failed: {e}")

        shutil.make_archive(output_path.replace(".zip", ""), "zip", tmpdir)

        save_job_record(job_id, template, output_path)

        return JSONResponse({
            "ok": True,
            "message": f"Formatted successfully with {template}",
            "job_id": job_id,
            "download_url": f"/download/{job_id}"
        })
