from pydantic import BaseModel
from typing import Dict, List, Optional

class CategoryDistribution(BaseModel):
    category: str
    count: int

class DailyTrend(BaseModel):
    date: str
    count: int

class AnalyticsSummary(BaseModel):
    total_reports: int
    status_distribution: Dict[str, int]
    category_distribution: List[CategoryDistribution]
    severity_distribution: Dict[str, int]
    avg_response_time_hours: Optional[float] = None
    daily_trend: List[DailyTrend]