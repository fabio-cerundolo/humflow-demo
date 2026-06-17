# -*- coding: utf-8 -*-
"""
ollama_processor.py — Pipeline AI locale "solo testo", alternativa leggera a Groq.

Pensata per PC senza GPU dedicata potente:
    1. Estrazione testo grezzo dal PDF con PyMuPDF (fitz) — più rapido di pypdf/pdfplumber.
    2. Analisi del testo con un modello locale leggero (es. llama3.1:8b o mistral:7b)
       servito da Ollama, chiedendo una risposta JSON strutturata.

Questo modulo NON modifica le funzioni esistenti in app/worker.py
(extract_text_from_pdf, call_groq_for_cv): è un percorso alternativo,
attivabile via variabile d'ambiente AI_PROVIDER=ollama.

Lo schema JSON restituito è identico a quello di call_groq_for_cv, così
il resto della pipeline (creazione candidato, skill, screening, email GDPR)
funziona senza alcuna modifica.
"""

import io
import os
import json
import logging

import requests
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


# ----------------------------------------------------------------------
# Helper: estrazione testo da PDF con PyMuPDF (pipeline locale leggera)
# ----------------------------------------------------------------------
def extract_text_from_pdf_local(file_bytes: bytes) -> str:
    """
    Restituisce il testo leggibile di un PDF usando PyMuPDF (fitz).
    Alternativa più leggera/rapida a pypdf, usata quando AI_PROVIDER=ollama.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:  # pragma: no cover
        logger.error("Impossibile aprire il PDF con PyMuPDF: %s", exc)
        return ""

    text_parts = []
    try:
        for page_num, page in enumerate(doc, start=1):
            try:
                page_text = page.get_text() or ""
                if page_text.strip():
                    text_parts.append(page_text)
            except Exception as exc:  # pragma: no cover
                logger.warning(
                    "Errore nell'estrazione del testo dalla pagina %s: %s", page_num, exc
                )
    finally:
        doc.close()

    return "\n".join(text_parts).strip()


# ----------------------------------------------------------------------
# Helper: chiamata a Ollama (modello locale) con risposta JSON strutturata
# ----------------------------------------------------------------------
def call_ollama_for_cv(cv_text: str) -> dict:
    """
    Invia il testo del CV a un modello locale tramite Ollama (es. llama3.1:8b)
    chiedendo un oggetto JSON con gli stessi campi usati da call_groq_for_cv:
        full_name, email, phone, summary, skills (list[str]),
        experience (list[dict]), education (list[dict]), languages (list[str])
    """
    base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
    model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    timeout = int(os.getenv("OLLAMA_TIMEOUT", "120"))  # i modelli locali su CPU possono essere lenti

    # Stesso prompt/schema usato da call_groq_for_cv, per garantire compatibilità
    # con il resto della pipeline (nessuna modifica al codice che consuma il risultato).
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

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "format": "json",       # forziamo output JSON (supportato da Ollama >= 0.1.x)
        "options": {
            "temperature": 0.2,  # basso per risposte più deterministe
        },
    }

    try:
        response = requests.post(f"{base_url}/api/chat", json=payload, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.error(
            "Errore chiamando Ollama (%s, modello %s): %s", base_url, model, exc
        )
        raise  # rilancia affinché il chiamante gestisca/segnali l'errore

    try:
        body = response.json()
        raw_json = body.get("message", {}).get("content", "").strip()
    except (ValueError, AttributeError) as exc:
        logger.error("Risposta Ollama non decodificabile: %s", exc)
        raise ValueError("Risposta Ollama non valida") from exc

    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError as exc:  # pragma: no cover
        logger.error("Ollama ha restituito JSON non valido: %s", raw_json)
        raise ValueError("Risposta Ollama non parsabile come JSON") from exc

    # Normalizziamo eventuali campi mancanti (stesso comportamento di call_groq_for_cv)
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
