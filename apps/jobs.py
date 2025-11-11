# jobs.py — simple in-memory + SQLite job registry
import os
import sqlite3
import threading
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/jobs", tags=["jobs"])
DB_PATH = os.getenv("JOBS_DB", "/tmp/paperpolish_jobs.db")

_lock = threading.Lock()

def _init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                created_at REAL,
                filename TEXT,
                size INTEGER,
                template TEXT,
                options TEXT,
                warnings TEXT,
                download_url TEXT
            )
        """)
        conn.commit()

_init_db()

def _row_to_dict(r):
    return {
        "id": r[0],
        "created_at": r[1],
        "filename": r[2],
        "size": r[3],
        "template": r[4],
        "options": r[5].split(",") if r[5] else [],
        "warnings": r[6].split("|||") if r[6] else [],
        "download_url": r[7],
    }

@router.get("/")
def list_jobs():
    """Return all jobs in reverse chronological order."""
    with _lock, sqlite3.connect(DB_PATH) as conn:
        cur = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC")
        return [_row_to_dict(r) for r in cur.fetchall()]

@router.get("/{job_id}")
def get_job(job_id: str):
    with _lock, sqlite3.connect(DB_PATH) as conn:
        cur = conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Job not found")
        return _row_to_dict(row)

@router.post("/")
def create_job(job: dict):
    """Create a new job record (called by upload endpoint)."""
    if "id" not in job or "download_url" not in job:
        raise HTTPException(400, "Missing required fields")

    fields = (
        job["id"],
        job.get("createdAt") or job.get("created_at"),
        job.get("filename"),
        job.get("size"),
        job.get("template"),
        ",".join(job.get("options", [])),
        "|||".join(job.get("warnings", [])),
        job["download_url"],
    )

    with _lock, sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT OR REPLACE INTO jobs
            (id, created_at, filename, size, template, options, warnings, download_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, fields)
        conn.commit()
    return {"ok": True, "id": job["id"]}

@router.delete("/{job_id}")
def delete_job(job_id: str):
    with _lock, sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM jobs WHERE id=?", (job_id,))
        conn.commit()
    return {"ok": True}
