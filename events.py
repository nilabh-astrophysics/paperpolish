from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.utils.logger import get_logger
from pathlib import Path
import json, datetime

router = APIRouter()
logger = get_logger()

def _events_path() -> Path:
    """Return the file path for event logs"""
    p = Path(__file__).resolve().parents[1] / "data" / "logs" / "events.jsonl"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p

@router.post("/_events")
async def capture_event(request: Request):
    """Capture frontend analytics or app events."""
    try:
        data = await request.json()
    except Exception:
        data = {}

    # Create structured event record
    rec = {
        "ts": datetime.datetime.utcnow().isoformat() + "Z",
        "ip": request.client.host if request.client else None,
        "ua": request.headers.get("user-agent"),
        **data,
    }

    # Write to file
    with _events_path().open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    # Log event summary
    logger.info(f'event kind={data.get("kind")} label="{data.get("label")}"')

    return JSONResponse({"ok": True})
