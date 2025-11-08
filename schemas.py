from pydantic import BaseModel
from typing import Optional, List

class FormatRequest(BaseModel):
    template: str
    options: Optional[List[str]] = []

class FormatResponse(BaseModel):
    job_id: str
    warnings: list
