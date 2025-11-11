from pydantic import BaseModel
from typing import List, Optional

class JobRecord(BaseModel):
    id: Optional[str]
    createdAt: Optional[str]
    filename: Optional[str]
    template: str
    options: List[str]
    warnings: Optional[List[str]]
    downloadUrl: Optional[str]
    size: Optional[int]
