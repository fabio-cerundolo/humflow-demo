from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm

from .cv_processor import process_cv_file
from .database import SessionLocal, init_db, get_db
from .models import Candidate
from .auth import Token, authenticate_user, create_access_token, get_current_user

app = FastAPI(title="FluxHR API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# BUG #1 FIXED: StatusUpdate era definita due volte (a riga ~23 e ~97).
class StatusUpdate(BaseModel):
    status: str

class DashboardStats(BaseModel):
    total_candidates: int
    status_pie: List[dict]
    skills_bar: List[dict]
    status_distribution: dict


@app.on_event("startup")
def startup():
    init_db()


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        total = db.query(Candidate).count()

        all_candidates = db.query(Candidate.skills).all()
        skill_counts = {}
        for row in all_candidates:
            if row[0]:
                for skill in row[0]:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1

        skills_bar = [
            {"name": k, "count": v}
            for k, v in sorted(skill_counts.items(), key=lambda item: item[1], reverse=True)
        ][:5]

        status_pie = [
            {"name": "Nuovi", "value": db.query(Candidate).filter(Candidate.status == "new").count()},
            {"name": "Revisionati", "value": db.query(Candidate).filter(Candidate.status == "reviewed").count()},
            {"name": "Shortlist", "value": db.query(Candidate).filter(Candidate.status == "shortlisted").count()},
        ]

        return {
            "total_candidates": total,
            "status_pie": status_pie,
            "skills_bar": skills_bar,
            "status_distribution": {item["name"]: item["value"] for item in status_pie},
        }
    except Exception as e:
        print(f"Error in stats: {e}")
        # BUG #3 FIXED: il fallback mancava di status_pie, causando ValidationError Pydantic.
        return {
            "total_candidates": 0,
            "status_pie": [],
            "skills_bar": [],
            "status_distribution": {},
        }


@app.get("/candidates")
def get_candidates(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Candidate).order_by(Candidate.created_at.desc()).all()


from fastapi import UploadFile, File, Depends
from sqlalchemy.orm import Session
# ... altri import esistenti ...

@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Leggi il file e processalo (questo crea il candidato nel DB)
    file_bytes = await file.read()
    candidate = process_cv_file(file_bytes, file.filename, db)
    
    # 2. LOGICA DI SCREMATURA AUTOMATICA
    REQUIRED_SKILLS = ["python", "react", "typescript", "aws", "leadership"]
    MIN_MATCH_THRESHOLD = 0.3  # Scarta se corrisponde a meno del 30%
    
    # Normalizza le skill del candidato in minuscolo per il confronto
    cand_skills = candidate.skills if isinstance(candidate.skills, list) else []
    extracted_lower = [skill.lower().strip() for skill in cand_skills]
    
    # Calcola quante skill richieste sono presenti
    matches = [skill for skill in REQUIRED_SKILLS if skill in extracted_lower]
    match_percentage = len(matches) / len(REQUIRED_SKILLS) if REQUIRED_SKILLS else 0
    
    # Aggiorna stato e motivo in base alla percentuale
    if match_percentage < MIN_MATCH_THRESHOLD:
        candidate.status = "rejected"
        candidate.rejection_reason = f"Scartato auto: match Skill Gap troppo basso ({int(match_percentage * 100)}%)"
    else:
        candidate.status = "new"
        candidate.rejection_reason = None
        
    # 3. Salva le modifiche nel database
    db.commit()
    db.refresh(candidate)
    
    return {"message": "CV caricato e analizzato", "candidate_id": candidate.id}


@app.patch("/candidates/{candidate_id}/status")
def update_status(
    candidate_id: int,
    update: StatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(404, "Candidato non trovato")
    candidate.status = update.status
    db.commit()
    return {"message": "Stato aggiornato", "new_status": candidate.status}


@app.delete("/candidates/{candidate_id}")
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(404, "Candidato non trovato")
    db.delete(candidate)
    db.commit()
    return {"message": "Candidato rimosso con successo"}


# BUG #7 FIXED: download_cv non aveva il Depends(get_current_user),
# permettendo il download non autenticato di qualsiasi CV.
@app.get("/candidates/{candidate_id}/download")
def download_cv(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate or not candidate.cv_file_path:
        raise HTTPException(404, "File non trovato")
    return FileResponse(candidate.cv_file_path)
