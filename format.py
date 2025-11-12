# format.py
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse

from latex_formatter import process_archive
from store import put_zip, save_job
from logger import get_logger

logger = get_logger()
router = APIRouter()

@router.post("/format")
async def format_tex(
    request: Request,
    # Accept either form field name "archive" or "file" (some clients use different names)
    archive: UploadFile | None = File(None),
    file: UploadFile | None = File(None),
    template: str = Form("aastex"),
    options: str = Form(""),
):
    """
    Accepts a single uploaded file (zip project or single .tex) under form field
    'archive' OR 'file'. Returns a job_id, warnings and a download URL.
    """
    uploaded = archive or file
    if uploaded is None:
        raise HTTPException(status_code=400, detail="No file provided in 'archive' or 'file' form fields")

    filename = uploaded.filename or ""
    if not filename.lower().endswith((".zip", ".tex")):
        raise HTTPException(status_code=400, detail="Upload .zip (project) or .tex (single file)")

    job_id = str(uuid.uuid4())
    logger.info(f'job_start id={job_id} file="{filename}" template={template} options="{options}"')

    try:
        # Run the formatter (returns list[str] warnings, and a path to a temp zip)
        warnings, tmp_zip = await process_archive(
            uploaded,
            template,
            options.split(",") if options else []
        )

        # Persist the resulting zip using our store helper
        _, saved_path = put_zip(tmp_zip, job_id)

        # Save some minimal job metadata as JSON
        save_job(job_id, {
            "filename": filename,
            "template": template,
            "options": options,
            "zip_path": saved_path,
            "warnings_count": len(warnings),
        })
        logger.info(f'job_zip_saved id={job_id} path="{saved_path}"')

        # Build absolute download URL using request.base_url (keeps scheme/host)
        base = str(request.base_url).rstrip("/")  # e.g. https://paperpolish-api-xxxx.onrender.com/
        # Note: route for downloads may be mounted as /api/download - adjust if necessary.
        download_url = f"{base}/download/{job_id}"

        logger.info(f'job_done id={job_id} warnings={len(warnings)}')
        return JSONResponse({
            "job_id": job_id,
            "warnings": warnings,
            "download_url": download_url,
        })

    except Exception as e:
        logger.exception(f'job_failed id={job_id} error="{e}"')
        raise HTTPException(status_code=500, detail="Internal server error")
