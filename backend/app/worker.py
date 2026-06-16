# -*- coding: utf-8 -*-
"""
worker.py — Celery worker per humflow (versione con Groq AI).
"""

import os
import base64
import smtplib
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta

import requests
import pypdf                     # <-- per l'estrazione testo dal PDF
from groq import Groq, GroqError # <-- SDK ufficiale Groq

from celery import Celery
from celery.schedules import crontab
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.models import Candidate, Skill

from .database import SessionLocal
from .models import Candidate, Skill   # <-- assicurati che questi import siano corretti
from .templates.gdpr_email import get_art14_html



# ----------------------------------------------------------------------
# Logger
# ----------------------------------------------------------------------
logger = logging.getLogger(__name__)
if not logger.handlers:  # configurazione di base se non già presente
    logging.basicConfig(level=logging.INFO)

# ------------------------------------------------------------------
# Celery app – single source of truth
# ------------------------------------------------------------------
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery_app = Celery(
    "humflow",
    broker=REDIS_URL,
    backend=REDIS_URL,
    # Auto‑discover tasks in this package (you can adjust the path)
    include=["app.worker.worker"],   # <- this file itself contains the tasks
)

# Optional Celery tuning (feel free to adapt)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,
)
# ------------------------------------------------------------------
# Beat schedule (unchanged)
# ------------------------------------------------------------------
celery_app.conf.beat_schedule = {
    "ingest-every-30s": {
        "task": "app.worker.worker.ingest_emails_task",
        "schedule": 30.0,
    },
    "delete-old-candidates": {
        "task": "app.worker.worker.delete_old_candidates",
        "schedule": crontab(hour=2, minute=0),
    },
}
celery_app.conf.timezone = "UTC"

# ----------------------------------------------------------------------
# Helper: estrazione testo da PDF (pypdf)
# ----------------------------------------------------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Restituisce il testo leggibile di un PDF fornito come bytes.
    """
    try:
        reader = pypdf.PdfReader(Path(file_bytes))  # pypdf accetta anche BytesIO
    except Exception as exc:  # pragma: no cover
        logger.error("Impossibile aprire il PDF: %s", exc)
        return ""

    text_parts = []
    for page_num, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text)
        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Errore nell'estrazione del testo dalla pagina %s: %s", page_num, exc
            )
    return "\n".join(text_parts).strip()


# ----------------------------------------------------------------------
# Helper: chiamata a Groq con risposta JSON strutturata
# ----------------------------------------------------------------------
def call_groq_for_cv(cv_text: str) -> dict:
    """
    Invia il testo del CV a Groq (Llama‑3‑70B‑versatile) chiedendo un oggetto JSON
    con i seguenti campi:
        full_name, email, phone, summary, skills (list[str]),
        experience (list[dict]), education (list[dict]), languages (list[str])
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY non impostata nelle variabili d'ambiente")

    client = Groq(api_key=api_key)

    system_prompt = (
        "Sei un assistente specializzato nell'analisi di CV. "
        "Estrarre le informazioni seguenti e restituirle **esclusivamente** "
        "come oggetto JSON valido (nessun testo aggiuntivo). "
        "Campi richiesti: "
        "{"
        "\"full_name\": string | null, "
        "\"email\": string | null, "
        "\"phone\": string | null, "
        "\"summary\": string, "
        "\"skills\": string[], "
        "\"experience\": ["
        "  {"
        "\"role\": string, "
        "\"company\": string, "
        "\"start_date\": string (format YYYY-MM), "
        "\"end_date\": string (format YYYY-MM | null), "
        "\"description\": string"
        "}"
        "], "
        "\"education\": ["
        "  {"
        "\"degree\": string, "
        "\"institution\": string, "
        "\"graduation_year\": string (format YYYY | null)"
        "}"
        "], "
        "\"languages\": string[]"
        "}"
    )

    user_prompt = f"Ecco il testo del CV:\n\n{cv_text}\n\nRestituisci solo il JSON."

    try:
        completion = client.chat.completions.create(
            model="llama-3-70b-versatile",   # modello veloce e di alta qualità su Groq
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.2,          # basso per risposte più deterministe
            max_tokens=1500,
            response_format={"type": "json_object"},   # forziamo JSON
        )
    except GroqError as exc:  # cattura errori di rete, auth, rate‑limit, ecc.
        logger.error("Errore chiamando Groq: %s", exc)
        raise  # rilancia affinché Celery segnali il task come fallito

    raw_json = completion.choices[0].message.content.strip()
    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError as exc:  # pragma: no cover – dovrebbe essere JSON valido
        logger.error("Groq ha restituito JSON non valido: %s", raw_json)
        raise ValueError("Risposta Groq non parsabile come JSON") from exc

    # Normalizziamo eventuali campi mancanti (opzionale)
    defaults = {
        "full_name": None,
        "email": None,
        "phone": None,
        "summary": "",
        "skills": [],
        "experience": [],
        "education": [],
        "languages": [],
    }
    for k, v in defaults.items():
        data.setdefault(k, v)

    return data


# ----------------------------------------------------------------------
# Task principale: ingestione email da MailHog → analisi CV con Groq
# ----------------------------------------------------------------------
@celery_app.task(name="app.worker.ingest_emails_task")
def ingest_emails_task():
    """
    Scorre la coda di MailHog, cerca allegati PDF/DOCX,
    li analizza con Groq, salva il candidato nel DB,
    applica lo screening delle skill, invia l'email GDPR e
    notifica il backend per aggiornare il frontend.
    """
    try:
        limit = 100
        start = 0
        processed = 0

        while True:
            url = f"http://mailhog:8025/api/v2/messages?limit={limit}&start={start}"
            try:
                resp = requests.get(url, timeout=10)
                resp.raise_for_status()
            except requests.RequestException as exc:
                logger.error("MailHog API error: %s", exc)
                break

            data = resp.json()
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
                    found_attachment = False

                    for part in parts:
                        headers = part.get("Headers", {})
                        content_disposition = headers.get("Content-Disposition", [""])[0]
                        if "filename=" not in content_disposition:
                            continue

                        filename = content_disposition.split("filename=")[1].strip('"')
                        if not filename.lower().endswith((".pdf", ".docx")):
                            continue  # ignoriamo allegati non CV

                        body = part.get("Body", "")
                        transfer_encoding = headers.get("Content-Transfer-Encoding", [""])[0].lower()

                        # ---- Decodifica dell'allegato ----
                        if transfer_encoding == "base64":
                            try:
                                file_bytes = base64.b64decode(body)
                            except Exception as e:
                                logger.warning(
                                    "Errore decodifica base64 per %s: %s", filename, e
                                )
                                continue
                        else:
                            # Alcuni client inviano il raw già decodificato
                            try:
                                file_bytes = base64.b64decode(body)
                            except Exception:
                                file_bytes = body.encode()

                        if not file_bytes:
                            continue

                        # ---- 1️⃣ Estrai testo dal PDF/DOCX ----
                        # Nota: pypdf gestisce solo PDF. Per DOCX potremmo usare python-docx,
                        # ma per semplicità trattiamo entrambi come PDF (il tuo flusso attuale
                        # probabilmente gestisce solo PDF). Se vuoi supportare DOCX, aggiungi
                        # qui la logica con python-docx.
                        cv_text = extract_text_from_pdf(file_bytes)
                        if not cv_text:
                            logger.warning(
                                "Il file %s sembra vuoto o non contiene testo estratto.", filename
                            )
                            # continuiamo comunque – Groq riceverà una stringa vuota

                        # ---- 2️⃣ Analisi con Groq ----
                        try:
                            groq_result = call_groq_for_cv(cv_text)
                        except Exception as exc:  # qualsiasi errore Groq
                            logger.exception(
                                "Analisi Groq fallita per allegato %s", filename
                            )
                            continue  # passa al prossimo allegato/email

                        # ---- 3️⃣ Creazione record ORM ----
                        candidate = Candidate(
                            full_name=groq_result.get("full_name"),
                            email=groq_result.get("email"),
                            phone=groq_result.get("phone"),
                            summary=groq_result.get("summary", ""),
                            # i campi experience, education, languages vengono salvati come JSON
                            experience=groq_result.get("experience", []),
                            education=groq_result.get("education", []),
                            languages=groq_result.get("languages", []),
                        )
                        db.add(candidate)
                        db.flush()  # ottieni l'id prima di aggiungere le skill

                        # Skill: assumiamo una relazione molti‑a‑molti tramite tabella candidate_skill
                        # oppure una semplice tabella Skill con foreign key candidate_id.
                        # Qui inseriamo una riga per ogni skill nella tabella Skill.
                        skill_objs = []
                        for skill_name in groq_result.get("skills", []):
                            if not skill_name or not isinstance(skill_name, str):
                                continue
                            skill = Skill(name=skill_name.strip(), candidate_id=candidate.id)
                            db.add(skill)
                            skill_objs.append(skill)

                        # ---- 4️⃣ Screening automatico (3 livelli) ----
                        REQUIRED_SKILLS = ["python", "react", "typescript", "aws", "leadership"]
                        candidate_skill_names = [
                            s.name.lower() for s in skill_objs if s.name
                        ]
                        required_lower = [s.lower() for s in REQUIRED_SKILLS]

                        matches = [
                            skill for skill in required_lower if skill in candidate_skill_names
                        ]
                        match_percentage = (
                            len(matches) / len(required_lower) if required_lower else 0
                        )

                        if match_percentage < 0.3:
                            candidate.status = "rejected"
                            candidate.rejection_reason = (
                                f"Scartato auto: match Skill Gap troppo basso "
                                f"({int(match_percentage * 100)}%)"
                            )
                        elif match_percentage < 0.7:
                            candidate.status = "reviewed"
                            candidate.rejection_reason = (
                                f"Revisionato auto: match parziale "
                                f"({int(match_percentage * 100)}%). Richiede verifica."
                            )
                        else:
                            candidate.status = "new"
                            candidate.rejection_reason = (
                                f"Alta corrispondenza skill rilevata "
                                f"({int(match_percentage * 100)}%)"
                            )

                        db.commit()
                        logger.info(
                            "CV %s elaborato – candidato ID %s, status=%s",
                            filename,
                            candidate.id,
                            candidate.status,
                        )

                        # ---- 5️⃣ Email GDPR ----
                        try:
                            send_art14_email_task.delay(
                                candidate.email,
                                candidate.full_name or "Candidato",
                            )
                        except Exception as e:
                            logger.error(
                                "Impossibile enqueuare email GDPR per %s: %s",
                                candidate.email,
                                e,
                            )

                        # ---- 6️⃣ Notifica interna al backend (WebSocket polling fallback) ----
                        try:
                            internal_secret = os.getenv(
                                "INTERNAL_API_SECRET", "internal-secret-change-me-in-production"
                            )
                            requests.post(
                                "http://backend:8000/internal/notify-update",
                                params={"X-Internal-Secret": internal_secret},
                                timeout=2,
                            )
                        except Exception as e:
                            logger.warning(
                                "Impossibile notificare frontend (%s): %s", internal_secret, e
                            )

                        found_attachment = True
                        # (nel caso di più allegati per lo stesso messaggio, continuiamo a processarli)
                        # ma segnaliamo che il messaggio è stato gestito almeno una volta.

                    if found_attachment:
                        # Rimuoviamo il messaggio da MailHog solo se abbiamo trovato almeno un allegato CV
                        try:
                            requests.delete(
                                f"http://mailhog:8025/api/v1/messages/{msg_id}",
                                timeout=5,
                            )
                        except requests.RequestException as exc:
                            logger.error(
                                "Errore cancellazione messaggio %s da MailHog: %s", msg_id, exc
                            )
                        processed += 1
                    else:
                        logger.info(
                            "Nessun allegato CV trovato nel messaggio %s", msg_id
                        )

                except Exception as exc:  # pragma: no cover – catch‑all per non perdere il messaggio
                    logger.exception(
                        "Errore grave processando messaggio %s", msg_id
                    )
                finally:
                    db.close()

            if len(messages) < limit:
                break
            start += limit

        logger.info("Worker: elaborati %s nuovi CV", processed)

    except Exception as exc:  # pragma: no cover
        logger.exception("Errore grave in ingest_emails_task: %s", exc)


# ----------------------------------------------------------------------
# Task: invio email GDPR (art. 14)
# ----------------------------------------------------------------------
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
        logger.info("[Celery] Email Art.14 inviata a %s", email_dest)
        return True
    except Exception as exc:
        logger.error("[Celery] ERRORE invio email: %s", exc)
        return False


# ----------------------------------------------------------------------
# Task: cancellazione candidati più vecchi di 6 mesi (GDPR retention)
# ----------------------------------------------------------------------
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
        logger.info("[Retention] Eliminati %s candidati con dati scaduti", deleted)
        return deleted
    except Exception as exc:
        db.rollback()
        logger.error("[Retention] ERRORE: %s", exc)
        raise
    finally:
        db.close()
