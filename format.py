import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from app.services.latex_formatter import process_archive
from app.services.store import save_job, jobs_dir
from app.utils.logger import get_logger  # ✅ Logging added

logger = get_logger()
router = APIRouter()


@router.post("/format")
async def format_tex(
    request: Request,
    archive: UploadFile = File(...),
    template: str = Form("aastex"),
    options: str = Form("")
):
    # ✅ Validate file type
    if not archive.filename.endswith((".zip", ".tex")):
        raise HTTPException(400, "Upload .zip (project) or .tex (single file)")

    job_id = str(uuid.uuid4())
    logger.info(f'job_start id={job_id} file="{archive.filename}" template={template} options="{options}"')

    try:
        # ✅ Process the LaTeX archive
        warnings, tmp_zip = await process_archive(
            archive,
            template,
            options.split(",") if options else []
        )

        # ✅ Persist into data/jobs/<job_id>.zip
        dest = os.path.join(jobs_dir(), f"{job_id}.zip")
        shutil.copyfile(tmp_zip, dest)
        save_job(job_id, dest)
        logger.info(f'job_zip_saved id={job_id} dest="{dest}"')

        # ✅ Build full download URL
        base = f"{request.base_url.scheme}://{request.base_url.hostname}"
        port = request.base_url.port
        if port:
            base = f"{base}:{port}"
        download_url = f"{base}/download/{job_id}"

        logger.info(f'job_done id={job_id} warnings={len(warnings)}')
        return JSONResponse({
            "job_id": job_id,
            "warnings": warnings,
            "download_url": download_url
        })

    except Exception as e:
        logger.exception(f'job_failed id={job_id} error="{e}"')
        raise HTTPException(status_code=500, detail=str(e))
