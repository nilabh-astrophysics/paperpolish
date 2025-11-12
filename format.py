# format.py
import os
import tempfile
import zipfile
import subprocess
import shutil
import uuid

from fastapi import APIRouter, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from jobs import save_job_record  # local import, jobs.py in same folder

router = APIRouter()

@router.post("/format")
async def format_paper(file: UploadFile, template: str = Form("aastex")):
    """
    Accepts uploaded .zip file, performs (placeholder) formatting,
    writes a result zip to /tmp and stores job metadata via jobs.save_job_record.
    """
    # Basic validation
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    if not (file.filename.endswith(".zip") or file.filename.endswith(".tex")):
        raise HTTPException(status_code=400, detail="Only .zip or .tex allowed (zip recommended)")

    job_id = str(uuid.uuid4())
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # save upload to disk
            input_path = os.path.join(tmpdir, "input_upload")
            os.makedirs(input_path, exist_ok=True)
            uploaded_zip_path = os.path.join(tmpdir, "uploaded.zip")
            with open(uploaded_zip_path, "wb") as f:
                shutil.copyfileobj(file.file, f)

            # extract if zip; if single tex we just copy
            if uploaded_zip_path.endswith(".zip"):
                with zipfile.ZipFile(uploaded_zip_path, "r") as z:
                    z.extractall(input_path)

            # === Placeholder formatting work ===
            # Replace with real LaTeX formatting steps (bibtex fixes, sed, latexmk, etc.)
            # For now we create a dummy file to include in output
            result_dir = os.path.join(tmpdir, "result")
            os.makedirs(result_dir, exist_ok=True)
            placeholder = os.path.join(result_dir, "README.txt")
            with open(placeholder, "w") as p:
                p.write(f"Formatted with template: {template}\njob_id: {job_id}\n")

            # create an output zip
            output_zip_base = f"/tmp/paperpolish_{job_id}"
            output_zip_path = f"{output_zip_base}.zip"
            shutil.make_archive(output_zip_base, "zip", result_dir)

            # Save job metadata so download endpoint can find file
            save_job_record(job_id=job_id, template=template, output_path=output_zip_path)

            return JSONResponse({
                "ok": True,
                "message": "Formatting completed (MVP).",
                "job_id": job_id,
                "download_url": f"/download/{job_id}"
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Formatting failed: {e}")
