import os
import io
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import jwt
import bcrypt

from .database import SessionLocal, engine
from .models import Base, Candidate, Skill, candidate_skills, User
from .cv_processor import process_cv_file

# Crea le tabelle nel database (se non esistono già)
Base.metadata.create_all(bind=engine)

# ==========================================
# CONFIGURAZIONE FASTAPI
# ==========================================
app = FastAPI(
    title="Humflow API",
    description="Backend per il sistema ATS Humflow",
    version="1.0.0"
)

# Configurazione CORS per permettere al frontend React di comunicare
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# DIPENDENZE
# ==========================================
def get_db():
    """Fornisce una sessione database per ogni richiesta."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# MODELLI PYDANTIC (Schema Request/Response)
# ==========================================
class CandidateResponse(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    skills: List[str] = []
    status: str
    rejection_reason: Optional[str] = None
    cv_file_path: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class StatusUpdate(BaseModel):
    status: str

class StatsResponse(BaseModel):
    total_candidates: int
    skills_bar: List[Dict[str, Any]]
    status_pie: List[Dict[str, Any]]
    status_distribution: Dict[str, int]

class LoginRequest(BaseModel):
    username: str
    password: str

# ==========================================
# HELPER FUNCTIONS
# ==========================================
def candidate_to_dict(candidate: Candidate) -> Dict[str, Any]:
    """
    Converte un oggetto Candidate SQLAlchemy in un dizionario Python.
    Gestisce correttamente la relazione Many-to-Many per le skill,
    restituendo una lista di stringhe invece di oggetti Skill.
    """
    # Estrai i nomi delle skill dalla relazione
    skills_list = [skill.name for skill in candidate.skills] if candidate.skills else []
    
    return {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "skills": skills_list,
        "status": candidate.status,
        "rejection_reason": candidate.rejection_reason,
        "cv_file_path": candidate.cv_file_path,
        "created_at": candidate.created_at.isoformat() if candidate.created_at else None
    }

# ==========================================
# ENDPOINT: CANDIDATI
# ==========================================
@app.get("/candidates", response_model=List[CandidateResponse])
def get_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Restituisce tutti i candidati ordinati per data di creazione (più recenti prima)."""
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).offset(skip).limit(limit).all()
    
    # Converti ogni candidato in dizionario con skill come lista di stringhe
    return [candidate_to_dict(c) for c in candidates]

@app.get("/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Restituisce un singolo candidato per ID."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidato non trovato")
    return candidate_to_dict(candidate)

@app.patch("/candidates/{candidate_id}/status")
def update_candidate_status(
    candidate_id: int, 
    status_update: StatusUpdate, 
    db: Session = Depends(get_db)
):
    """Aggiorna lo stato di un candidato (es. da 'new' a 'reviewed')."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidato non trovato")
    
    # Validazione dello stato
    valid_statuses = ["new", "reviewed", "shortlisted", "rejected"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Stato non valido. Usa uno di: {', '.join(valid_statuses)}"
        )
    
    candidate.status = status_update.status
    
    # Se il candidato viene scartato manualmente, rimuovi il motivo di scarto automatico
    if status_update.status != "rejected":
        candidate.rejection_reason = None
    
    db.commit()
    db.refresh(candidate)
    
    return {"message": "Stato aggiornato con successo", "candidate": candidate_to_dict(candidate)}

@app.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Elimina un candidato dal database (GDPR compliance)."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidato non trovato")
    
    # Elimina le associazioni nella tabella di giunzione (cascade dovrebbe gestirlo, ma per sicurezza)
    db.execute(
        candidate_skills.delete().where(candidate_skills.c.candidate_id == candidate_id)
    )
    
    # Elimina il candidato
    db.delete(candidate)
    db.commit()
    
    return {"message": "Candidato eliminato con successo"}

# CAMBIA DA @app.delete A @app.post
@app.post("/candidates/bulk-delete-all")
def delete_all_candidates(db: Session = Depends(get_db)):
    """
    Elimina TUTTI i candidati dal database.
    Operazione irreversibile - usare con cautela.
    """
    try:
        # Elimina prima le associazioni nella tabella di giunzione
        db.execute(candidate_skills.delete())
        
        # Elimina tutti i candidati
        deleted_count = db.query(Candidate).delete()
        
        db.commit()
        
        return {
            "message": "Tutti i candidati sono stati eliminati con successo",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Errore durante l'eliminazione di tutti i candidati: {str(e)}"
        )

@app.delete("/candidates/bulk-delete-all")
def delete_all_candidates(db: Session = Depends(get_db)):
    """
    Elimina TUTTI i candidati dal database.
    Operazione irreversibile - usare con cautela.
    """
    try:
        # Elimina prima le associazioni nella tabella di giunzione
        db.execute(candidate_skills.delete())
        
        # Elimina tutti i candidati
        deleted_count = db.query(Candidate).delete()
        
        db.commit()
        
        return {
            "message": "Tutti i candidati sono stati eliminati con successo",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Errore durante l'eliminazione di tutti i candidati: {str(e)}"
        )

# ==========================================
# ENDPOINT: UPLOAD CV
# ==========================================
@app.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Carica un CV (PDF o DOCX), lo processa per estrarre le informazioni,
    e crea un nuovo candidato nel database.
    """
    # Validazione del tipo di file
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(
            status_code=400, 
            detail="Tipo di file non supportato. Usa PDF o DOCX."
        )
    
    try:
        # Leggi il contenuto del file
        file_bytes = await file.read()
        
        # Processa il CV
        candidate = process_cv_file(file_bytes, file.filename, db)
        
        # ==========================================
        # LOGICA DI SCREMATURA AUTOMATICA (SKILL GAP)
        # ==========================================
        REQUIRED_SKILLS = ["python", "react", "typescript", "aws", "leadership"]
        MIN_MATCH_THRESHOLD = 0.3  # 30%
        
        # Estrai i nomi delle skill del candidato e convertili in lowercase
        candidate_skill_names = [skill.name.lower() for skill in candidate.skills] if candidate.skills else []
        required_lower = [skill.lower() for skill in REQUIRED_SKILLS]
        
        # Calcola il match
        matches = [skill for skill in required_lower if skill in candidate_skill_names]
        match_percentage = len(matches) / len(required_lower) if required_lower else 0
        
        # Assegna lo stato in base alla percentuale di match
        if match_percentage < MIN_MATCH_THRESHOLD:
            candidate.status = "rejected"
            candidate.rejection_reason = f"Scartato auto: match Skill Gap troppo basso ({int(match_percentage * 100)}%)"
        elif match_percentage < 0.7:
            candidate.status = "reviewed"
            candidate.rejection_reason = f"Revisionato auto: match parziale ({int(match_percentage * 100)}%). Richiede verifica."
        else:
            candidate.status = "new"
            candidate.rejection_reason = f"Alta corrispondenza skill rilevata ({int(match_percentage * 100)}%)"
        
        db.commit()
        db.refresh(candidate)
        
        return {
            "message": "CV caricato e processato con successo",
            "candidate": candidate_to_dict(candidate)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Errore nel processare il CV: {str(e)}"
        )

# ==========================================
# ENDPOINT: DOWNLOAD CV
# ==========================================
@app.get("/candidates/{candidate_id}/download")
def download_cv(candidate_id: int, db: Session = Depends(get_db)):
    """Scarica il file CV originale del candidato."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidato non trovato")
    
    if not candidate.cv_file_path:
        raise HTTPException(status_code=404, detail="File CV non trovato nel database")
    
    # Verifica che il file esista fisicamente sul disco
    if not os.path.exists(candidate.cv_file_path):
        raise HTTPException(
            status_code=404, 
            detail=f"File non trovato sul server: {candidate.cv_file_path}"
        )
    
    # Estrai il nome originale del file
    filename = os.path.basename(candidate.cv_file_path)
    
    # Determina il media type in base all'estensione
    if filename.lower().endswith('.pdf'):
        media_type = 'application/pdf'
    elif filename.lower().endswith('.docx'):
        media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else:
        media_type = 'application/octet-stream'
    
    # Restituisce il file come download
    return FileResponse(
        path=candidate.cv_file_path,
        media_type=media_type,
        filename=f"CV_{candidate.name or candidate.id}_{filename}",
        headers={"Content-Disposition": f'attachment; filename="CV_{candidate.name or candidate.id}_{filename}"'}
    )

# ==========================================
# ENDPOINT: STATISTICHE (DASHBOARD)
# ==========================================
@app.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """
    Restituisce le statistiche per la dashboard:
    - Totale candidati
    - Distribuzione skill (top 10)
    - Distribuzione stati (pipeline)
    """
    # Totale candidati
    total_candidates = db.query(Candidate).count()
    
    # Distribuzione skill (top 10)
    skills_count = (
        db.query(Skill.name, func.count(candidate_skills.c.skill_id).label('count'))
        .join(candidate_skills, Skill.id == candidate_skills.c.skill_id)
        .group_by(Skill.name)
        .order_by(func.count(candidate_skills.c.skill_id).desc())
        .limit(10)
        .all()
    )
    
    skills_bar = [{"name": name, "count": count} for name, count in skills_count]
    
    # Distribuzione stati
    status_counts = (
        db.query(Candidate.status, func.count(Candidate.id).label('count'))
        .group_by(Candidate.status)
        .all()
    )
    
    status_distribution = {status: count for status, count in status_counts}
    
    # Per il grafico a torta
    status_pie = [{"name": status, "value": count} for status, count in status_counts]
    
    return {
        "total_candidates": total_candidates,
        "skills_bar": skills_bar,
        "status_pie": status_pie,
        "status_distribution": status_distribution
    }

# ==========================================
# ENDPOINT: SKILL (per filtri e autocomplete)
# ==========================================
@app.get("/skills")
def get_all_skills(db: Session = Depends(get_db)):
    """Restituisce tutte le skill uniche presenti nel database."""
    skills = db.query(Skill).order_by(Skill.name).all()
    return [{"id": skill.id, "name": skill.name} for skill in skills]

# ==========================================
# ENDPOINT: HEALTH CHECK
# ==========================================
@app.get("/health")
def health_check():
    """Endpoint per verificare che il backend sia attivo."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# ==========================================
# ROOT
# ==========================================
@app.get("/")
def root():
    """Endpoint root con informazioni sull'API."""
    return {
        "message": "Humflow API v1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# ==========================================
# CONFIGURAZIONE AUTENTICAZIONE (JWT)
# ==========================================
SECRET_KEY = "humflow_super_secret_key_cambiami_in_produzione"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 ore

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ==========================================
# ENDPOINT: LOGIN
# ==========================================
@app.post("/token")
def login_for_access_token(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica l'utente e restituisce un JWT token.
    """
    # 1. Cerca l'utente nel database
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    # 2. Verifica la password usando bcrypt
    if not bcrypt.checkpw(login_data.password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    # 3. Genera il token JWT
    access_token = create_access_token(data={"sub": user.username})
    
    return {"access_token": access_token, "token_type": "bearer"}