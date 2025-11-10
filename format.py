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
    archive: UploadFile = File(...),
    template: str = Form("aastex"),
    options: str = Form("")
):
    # Only .zip (project) or .tex (single file)
    if not archive.filename.endswith((".zip", ".tex")):
        raise HTTPException(status_code=400, detail="Upload .zip (project) or .tex (single file)")

    job_id = str(uuid.uuid4())
    logger.info(f'job_start id={job_id} file="{archive.filename}" template={template} options="{options}"')

    try:
        # Run the formatter (returns list[str] warnings, and a path to a temp zip)
        warnings, tmp_zip = await process_archive(
            archive,
            template,
            options.split(",") if options else []
        )

        # Persist the resulting zip using our store helper
        _, saved_path = put_zip(tmp_zip, job_id)

        # Save some minimal job metadata as JSON
        save_job(job_id, {
            "filename": archive.filename,
            "template": template,
            "options": options,
            "zip_path": saved_path,
            "warnings_count": len(warnings),
        })
        logger.info(f'job_zip_saved id={job_id} path="{saved_path}"')

        # Build absolute download URL
        base = str(request.base_url).rstrip("/")  # e.g. https://paperpolish-api-xxxx.onrender.com
        download_url = f"{base}/download/{job_id}"

        logger.info(f'job_done id={job_id} warnings={len(warnings)}')
        return JSONResponse({
            "job_id": job_id,
            "warnings": warnings,
            "download_url": download_url,
        })

    except Exception as e:
        logger.exception(f'job_failed id={job_id} error="{e}"')
        raise HTTPException(status_code=500, detail=str(e))
