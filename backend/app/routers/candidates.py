# app/routers/candidates.py
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Candidate

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{candidate_id}/cv")
def download_cv(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidato non trovato")
        
    cv_content = candidate.cv_data
    filename = candidate.cv_filename
    
    if not cv_content:
        # Fallback: leggi dal file system
        if candidate.cv_file_path and os.path.exists(candidate.cv_file_path):
            try:
                with open(candidate.cv_file_path, "rb") as f:
                    cv_content = f.read()
                if not filename:
                    filename = os.path.basename(candidate.cv_file_path)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Errore lettura file CV: {str(e)}")
                
    if not cv_content:
        raise HTTPException(status_code=404, detail="CV non trovato")
        
    if not filename:
        filename = f"CV_{candidate_id}.pdf"
        
    return Response(
        content=cv_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )