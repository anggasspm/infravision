from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar("T")

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = ""