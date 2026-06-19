from pydantic import BaseModel


class AssignRequest(BaseModel):
    assigned_to: str  # user_id dengan role maintenance
