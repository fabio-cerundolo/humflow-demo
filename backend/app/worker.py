"""
worker.py — Celery worker per humflow.
"""
import os
import base64
import smtplib
import requests
# pyrefly: ignore [missing-import]
from celery import Celery
# pyrefly: ignore [missing-import]
from celery.schedules import crontab
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from .database import SessionLocal
from .models import Candidate, Skill
from .cv_processor import process_cv_file
from .templates.gdpr_email import get_art14_html

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery_app = Celery("humflow", broker=REDIS_URL, backend=REDIS_URL)

celery_app.conf.beat_schedule = {
    "ingest-every-30s": {
        "task": "app.worker.ingest_emails_task",
        "schedule": 30.0,
    },
    "delete-old-candidates": {
        "task": "app.worker.delete_old_candidates",
        "schedule": crontab(hour=2, minute=0),
    },
}
celery_app.conf.timezone = "UTC"

@celery_app.task(name="app.worker.ingest_emails_task")
def ingest_emails_task():
    try:
        limit = 100
        start = 0
        processed = 0
        
        while True:
            url = f"http://mailhog:8025/api/v2/messages?limit={limit}&start={start}"
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                print(f"MailHog API error: {response.status_code}")
                break

            data = response.json()
            messages = data.get("items", [])
            if not messages:
                break

            for msg in messages:
                msg_id = msg.get("ID")
                if not msg_id:
                    continue

                db = SessionLocal()
                try:
                    mime = msg.get("MIME", {})
                    parts = mime.get("Parts", [])
                    found = False

                    for part in parts:
                        headers = part.get("Headers", {})
                        content_disposition = headers.get("Content-Disposition", [""])[0]
                        if "filename=" in content_disposition:
                            filename = content_disposition.split("filename=")[1].strip('"')
                            if filename.endswith((".pdf", ".docx")):
                                body = part.get("Body", "")
                                transfer_encoding = headers.get("Content-Transfer-Encoding", [""])[0].lower()
                                file_bytes = None

                                if transfer_encoding == "base64":
                                    try:
                                        file_bytes = base64.b64decode(body)
                                    except Exception as e:
                                        print(f"Errore decodifica base64 per {filename}: {e}")
                                        continue
                                else:
                                    try:
                                        file_bytes = base64.b64decode(body)
                                    except:
                                        file_bytes = body.encode()

                                if file_bytes:
                                    # 1. Processa il CV
                                    candidate = process_cv_file(file_bytes, filename, db)
                                    
                                    # 2. LOGICA DI SCREMATURA AUTOMATICA (3 LIVELLI)
                                    REQUIRED_SKILLS = ["python", "react", "typescript", "aws", "leadership"]
                                    
                                    # ✅ CORRETTO: candidate.skills è una lista di oggetti Skill, quindi usiamo .name
                                    candidate_skill_names = [skill.name.lower() for skill in candidate.skills]
                                    required_lower = [skill.lower() for skill in REQUIRED_SKILLS]
                                     
                                    matches = [skill for skill in required_lower if skill in candidate_skill_names]
                                    match_percentage = len(matches) / len(required_lower) if required_lower else 0
                                    
                                    if match_percentage < 0.3:
                                        candidate.status = "rejected"
                                        candidate.rejection_reason = f"Scartato auto: match Skill Gap troppo basso ({int(match_percentage * 100)}%)"
                                    elif match_percentage < 0.7:
                                        candidate.status = "reviewed"
                                        candidate.rejection_reason = f"Revisionato auto: match parziale ({int(match_percentage * 100)}%). Richiede verifica."
                                    else:
                                        candidate.status = "new"
                                        candidate.rejection_reason = f"Alta corrispondenza skill rilevata ({int(match_percentage * 100)}%)"
                                        
                                    db.commit() # Salva stato e motivo
                                    
                                    # 3. Invia email GDPR
                                    send_art14_email_task.delay(candidate.email, candidate.name or "Candidato")
                                    try:
                                        # "backend" è il nome del servizio nel docker-compose.yml
                                        requests.post("http://backend:8000/internal/notify-update", timeout=2)
                                    except Exception as e:
                                        print(f"Impossibile notificare il frontend: {e}")
                                    
                                    found = True
                                    break

                    if found:
                        requests.delete(f"http://mailhog:8025/api/v1/messages/{msg_id}")
                        processed += 1
                    else:
                        print(f"Nessun allegato CV in messaggio {msg_id}")

                except Exception as e:
                    print(f"ERRORE processando messaggio {msg_id}: {e}")
                finally:
                    db.close()

            if len(messages) < limit:
                break
            start += limit

        print(f"Worker: elaborati {processed} nuovi CV")

    except Exception as e:
        print(f"Errore grave in ingest_emails_task: {e}")

@celery_app.task(name="app.worker.send_art14_email_task")
def send_art14_email_task(email_dest: str, name: str = "Candidato"):
    SMTP_SERVER = os.getenv("SMTP_SERVER", "mailhog")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 1025))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL = os.getenv("FROM_EMAIL", "privacy@humflow.com")
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "📌 Conferma Ricezione CV - humflow"
    msg["From"] = f"humflow Privacy <{FROM_EMAIL}>"
    msg["To"] = email_dest

    html_content = get_art14_html(name)
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            if SMTP_SERVER != "mailhog":
                server.starttls()
                if SMTP_USER and SMTP_PASSWORD:
                    server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"[Celery] Email Art.14 inviata a {email_dest}")
        return True
    except Exception as e:
        print(f"[Celery] ERRORE invio email: {e}")
        return False

@celery_app.task(name="app.worker.delete_old_candidates")
def delete_old_candidates():
    db = SessionLocal()
    try:
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        deleted = (
            db.query(Candidate)
            .filter(Candidate.created_at < six_months_ago)
            .delete()
        )
        db.commit()
        print(f"[Retention] Eliminati {deleted} candidati con dati scaduti")
        return deleted
    except Exception as e:
        db.rollback()
        print(f"[Retention] ERRORE: {e}")
        raise
    finally:
        db.close()