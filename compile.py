from fastapi import APIRouter
router = APIRouter()

@router.post("")
def compile_stub():
    return {"message": "Compile not implemented in starter."}
