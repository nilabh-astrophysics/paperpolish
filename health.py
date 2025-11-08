from fastapi import APIRouter

router = APIRouter()

# support both /health and /health/ and keep it out of /docs
@router.get("", include_in_schema=False)
@router.get("/", include_in_schema=False)
def health():
    # no awaits, no request body reads — just return immediately
    return {"ok": True}
