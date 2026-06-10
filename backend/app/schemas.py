# backend/app/schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- SCHEMA SKILL ---
class SkillBase(BaseModel):
    name: str

class Skill(SkillBase):
    id: int
    class Config:
        orm_mode = True

# --- SCHEMA CANDIDATE ---
class CandidateBase(BaseModel):
    name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    status: str = "new"
    rejection_reason: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class Candidate(CandidateBase):
    id: int
    created_at: datetime
    # IL FRONTEND SI ASPETTA UNA LISTA DI STRINGHE, NON DI OGGETTI
    skills: List[str] = [] 

    class Config:
        orm_mode = True

# --- SCHEMA STATS (per la dashboard) ---
class DashboardStats(BaseModel):
    total_candidates: int
    skills_bar: List[dict] = []
    status_pie: List[dict] = []
    status_distribution: dict = {}