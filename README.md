<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 120" width="100%" height="120">
  <!-- Sfondo coordinato con la dashboard dell'app -->
  <rect width="450" height="120" rx="16" fill="#12121a" stroke="#1f1f2e" stroke-width="1.5"/>
  
  <!-- Effetto Aurora SFX Soft -->
  <circle cx="40" cy="20" r="70" fill="#5b8cff" opacity="0.15" filter="blur(30px)" />
  <circle cx="400" cy="100" r="60" fill="#7c5cff" opacity="0.1" filter="blur(25px)" />

  <g transform="translate(30, 35)">
    <!-- Icona Monogramma H+F -->
    <path d="M10 10V40M10 25H26M26 10V40M26 25H34C37.5 25, 40 22, 40 18.5C40 15, 37.5 12, 34 12H28M26 32H36" 
          stroke="url(#ghGrad)" 
          stroke-width="5" 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          fill="none" />
          
    <circle cx="26" cy="25" r="3" fill="#12121a" stroke="#5b8cff" stroke-width="2.5"/>
    
    <defs>
      <linearGradient id="ghGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#5b8cff" />
        <stop offset="100%" stop-color="#7c5cff" />
      </linearGradient>
    </defs>
    
    <!-- Testo con lo stesso Font Stack e pesi della tua pagina -->
    <text x="65" y="32" font-family="'Space Grotesk', system-ui, sans-serif" font-size="32" font-weight="700" fill="#ffffff" letter-spacing="-0.5">
      hum<tspan fill="#5b8cff">flow</tspan>
    </text>
    
    <!-- Sottotitolo -->
    <text x="67" y="48" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="600" fill="#7c5cff" letter-spacing="2.5">
      AI-POWERED WORKFLOW ORCHESTRATION
    </text>
  </g>
</svg>


**Piattaforma HR Fullstack con Analisi CV Automatizzata e Architettura a Microservizi**

`humflow-demo` è un'applicazione enterprise-grade progettata per automatizzare e ottimizzare il flusso di gestione delle risorse umane. Il sistema permette l'upload di CV in formato PDF, ne estrae automaticamente le informazioni chiave tramite Intelligenza Artificiale, e gestisce lo stato dei candidati attraverso una dashboard reattiva, orchestrando il tutto tramite task asincroni per garantire scalabilità e resilienza.

## Panoramica Architetturale

Il progetto è stato concepito non come un monolite, ma come un'architettura distribuita e containerizzata, separando nettamente le responsabilità per massimizzare la manutenibilità e la scalabilità orizzontale.

```mermaid
graph TD
    subgraph Client
        UI[React + TypeScript UI<br/>Port: 3000]
    end

    subgraph Backend Services
        API[FastAPI Backend<br/>Port: 8000]
        Worker[Celery Worker<br/>Async Tasks]
        Broker[(Redis<br/>Message Broker)]
        DB[(PostgreSQL 16<br/>Persistent Storage)]
        Mail[MailHog<br/>SMTP Sandbox]
    end

    subgraph External
        AI[Groq API / Llama 3.3<br/>CV Analysis]
    end

    UI -->|REST / JWT| API
    API -->|Read/Write| DB
    API -->|Dispatch Task| Broker
    Broker -->|Consume| Worker
    Worker -->|Process PDF| AI
    Worker -->|Save Result| DB
    Worker -->|Send Notification| Mail
    Mail -.->|Test Inbox| UI
```
*(Nota: GitHub renderizzerà automaticamente questo blocco come un diagramma visivo)*

## Tech Stack

| Componente | Tecnologia | Motivazione Architetturale |
|------------|------------|----------------------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS | Type-safety e sviluppo rapido di interfacce reattive e manutenibili. |
| **Backend API** | Python, FastAPI, Uvicorn | Performance asincrone native e validazione dati robusta tramite Pydantic. |
| **Task Queue** | Celery, Redis | Gestione affidabile di operazioni I/O-bound (analisi AI) senza bloccare il thread principale dell'API. |
| **Database** | PostgreSQL 16 | Affidabilità, supporto JSONB e integrità referenziale per i dati strutturati dei candidati. |
| **Infrastructure** | Docker, Docker Compose | Riproducibilità dell'ambiente di sviluppo e isolamento netto dei servizi. |
| **Testing** | MailHog | Sandbox SMTP per testare flussi di notifica in isolamento, senza inquinare ambienti reali. |

## Scelte Architetturali (Architecture Decision Records)

1. **Separazione API / Worker (Pattern Producer-Consumer)**  
   L'analisi di un PDF e la successiva chiamata a un'API di LLM sono operazioni con latenza variabile (1-3 secondi). Eseguirle in modo sincrono all'interno della richiesta HTTP avrebbe bloccato i worker di FastAPI, degradando l'esperienza utente sotto carico. Delegando il task a Celery, l'API risponde immediatamente, garantendo alta disponibilità e permettendo al frontend di fare polling o usare WebSocket per il risultato.

2. **Scelta di FastAPI rispetto a Django/Flask**  
   FastAPI è stato selezionato per il suo supporto nativo all'asincronia (`async`/`await`) e per la generazione automatica della documentazione OpenAPI (Swagger), fondamentale per un'architettura che potrebbe evolvere verso un ecosistema di microservizi più ampio e per l'integrazione con team frontend separati.

3. **Redis come Message Broker**  
   Sebbene RabbitMQ o Kafka siano alternative valide per code complesse o ad alto throughput, Redis è stato scelto per questo progetto per la sua leggerezza, facilità di configurazione in Docker Compose e prestazioni eccellenti per code di task semplici e transienti.

## Prerequisiti

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) installati e in esecuzione.
- Una API Key valida per [Groq](https://console.groq.com) (per l'analisi AI dei CV).

## Avvio Rapido (Quick Start)

L'intera infrastruttura (5 servizi) può essere avviata localmente con un singolo comando.

1. **Clona il repository**
   ```bash
   git clone https://github.com/fabio-cerundolo/humflow-demo.git
   cd humflow-demo
   ```

2. **Configura le variabili d'ambiente**
   Crea un file `.env` nella root del progetto basandoti su `.env.example`:
   ```env
   GROQ_API_KEY=la_tua_api_key_qui
   # Le altre variabili (DB, Redis, SMTP) sono preconfigurate per l'ambiente Docker locale
   ```

3. **Avvia l'infrastruttura**
   ```bash
   docker-compose up --build
   ```
   *Nota: Al primo avvio, Docker scaricherà le immagini e costruirà i container. Potrebbe richiedere alcuni minuti.*

4. **Accedi alle applicazioni**
   - **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Documentazione API (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **MailHog (Sandbox Email)**: [http://localhost:8025](http://localhost:8025)

## Struttura del Progetto

```text
humflow-demo/
├── frontend/                 # Applicazione React + TypeScript
│   ├── src/
│   └── package.json
├── backend/                  # Applicazione FastAPI
│   ├── app/
│   │   ├── api/              # Endpoint REST
│   │   ├── core/             # Configurazione e dipendenze
│   │   ├── models/           # Modelli Pydantic e SQLAlchemy
│   │   └── tasks/            # Definizione dei task Celery
│   ├── celery_worker.py      # Entry point del worker asincrono
│   └── requirements.txt
├── docker-compose.yml        # Orchestrazione dei 5 servizi
├── .env.example              # Template delle variabili d'ambiente
└── README.md
```

## Sicurezza e Best Practices

- **Gestione dei Segreti**: Le credenziali (API Key, DB password) non sono mai committate nel repository. In un ambiente di produzione, verrebbero iniettate tramite un Secrets Manager (es. AWS Secrets Manager, HashiCorp Vault) o variabili d'ambiente del orchestrator.
- **Validazione degli Input**: Tutti i payload in ingresso sono rigorosamente validati tramite Pydantic per prevenire injection e garantire l'integrità dei dati.
- **Isolamento della Rete**: I servizi Docker comunicano su una rete interna definita in `docker-compose.yml`, esponendo all'host solo le porte strettamente necessarie.

## Scalabilità Futura

L'architettura è già predisposta per la scalabilità orizzontale:
- È possibile aumentare il numero di istanze del worker Celery (`docker-compose up --scale worker=3`) per gestire picchi di upload di CV senza modificare il codice.
- Il database PostgreSQL può essere facilmente migrato verso un'istanza gestita (es. AWS RDS) con repliche di lettura per separare i carichi di scrittura e lettura.

## Licenza

Questo progetto è distribuito con licenza MIT. Vedere il file `LICENSE` per i dettagli.

## Autore

**Fabio Cerundolo** — Web Solution Architect & Full-Stack Developer

- Portfolio: [fabio-cerundolo.dev](https://fabio-cerundolo.dev)
- GitHub: [@fabio-cerundolo](https://github.com/fabio-cerundolo)
- LinkedIn: [fabio-cerundolo](https://linkedin.com/in/fabio-cerundolo)
```

---

### 🎯 Perché questo README ti farà fare colpo:

1. **Il Diagramma Mermaid**: GitHub lo trasforma automaticamente in un'immagine. Un Tech Lead che apre il repo e vede un diagramma di architettura chiaro capisce immediatamente che non sei un semplice "codificatore", ma qualcuno che progetta sistemi.
2. **La sezione "Scelte Architetturali"**: Risponde in anticipo alle domande più difficili dei colloqui ("Perché Celery?", "Perché FastAPI?"). Dimostra che hai valutato i trade-off, che è la competenza #1 di un Solution Architect.
3. **La sezione "Scalabilità Futura"**: Mostra che pensi già al "giorno dopo", a come il sistema reggerà sotto carico, un altro segnale fortissimo di seniority.
4. **Linguaggio Professionale**: Termini come "Producer-Consumer", "I/O-bound", "Type-safety" e "Secrets Manager" posizionano il tuo profilo a un livello enterprise.

Fai un commit e un push di questo file. Quando lo mostrerai durante un colloquio (o lo linkerai nel CV), avrai un vantaggio competitivo enorme rispetto a chi presenta solo screenshot di interfacce. 🚀Perfetto! Ecco il **README.md definitivo** per `humflow-demo`, progettato specificamente per colpire nel segno durante i colloqui per ruoli di **Web Solution Architect**. 

Questo documento non si limita a dire *cosa* fa il progetto, ma spiega *perché* è stato costruito in quel modo, dimostrando capacità di pensiero sistemico, valutazione dei trade-off e conoscenza delle best practice enterprise.

Copia e incolla questo contenuto nel file `README.md` alla root del tuo repository `humflow-demo`:

```markdown
# humflow-demo

**Piattaforma HR Fullstack con Analisi CV Automatizzata e Architettura a Microservizi**

`humflow-demo` è un'applicazione enterprise-grade progettata per automatizzare e ottimizzare il flusso di gestione delle risorse umane. Il sistema permette l'upload di CV in formato PDF, ne estrae automaticamente le informazioni chiave tramite Intelligenza Artificiale, e gestisce lo stato dei candidati attraverso una dashboard reattiva, orchestrando il tutto tramite task asincroni per garantire scalabilità e resilienza.

## Panoramica Architetturale

Il progetto è stato concepito non come un monolite, ma come un'architettura distribuita e containerizzata, separando nettamente le responsabilità per massimizzare la manutenibilità e la scalabilità orizzontale.

```mermaid
graph TD
    subgraph Client
        UI[React + TypeScript UI<br/>Port: 3000]
    end

    subgraph Backend Services
        API[FastAPI Backend<br/>Port: 8000]
        Worker[Celery Worker<br/>Async Tasks]
        Broker[(Redis<br/>Message Broker)]
        DB[(PostgreSQL 16<br/>Persistent Storage)]
        Mail[MailHog<br/>SMTP Sandbox]
    end

    subgraph External
        AI[Groq API / Llama 3.3<br/>CV Analysis]
    end

    UI -->|REST / JWT| API
    API -->|Read/Write| DB
    API -->|Dispatch Task| Broker
    Broker -->|Consume| Worker
    Worker -->|Process PDF| AI
    Worker -->|Save Result| DB
    Worker -->|Send Notification| Mail
    Mail -.->|Test Inbox| UI
```
*(Nota: GitHub renderizzerà automaticamente questo blocco come un diagramma visivo)*

## Tech Stack

| Componente | Tecnologia | Motivazione Architetturale |
|------------|------------|----------------------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS | Type-safety e sviluppo rapido di interfacce reattive e manutenibili. |
| **Backend API** | Python, FastAPI, Uvicorn | Performance asincrone native e validazione dati robusta tramite Pydantic. |
| **Task Queue** | Celery, Redis | Gestione affidabile di operazioni I/O-bound (analisi AI) senza bloccare il thread principale dell'API. |
| **Database** | PostgreSQL 16 | Affidabilità, supporto JSONB e integrità referenziale per i dati strutturati dei candidati. |
| **Infrastructure** | Docker, Docker Compose | Riproducibilità dell'ambiente di sviluppo e isolamento netto dei servizi. |
| **Testing** | MailHog | Sandbox SMTP per testare flussi di notifica in isolamento, senza inquinare ambienti reali. |

## Scelte Architetturali (Architecture Decision Records)

1. **Separazione API / Worker (Pattern Producer-Consumer)**  
   L'analisi di un PDF e la successiva chiamata a un'API di LLM sono operazioni con latenza variabile (1-3 secondi). Eseguirle in modo sincrono all'interno della richiesta HTTP avrebbe bloccato i worker di FastAPI, degradando l'esperienza utente sotto carico. Delegando il task a Celery, l'API risponde immediatamente, garantendo alta disponibilità e permettendo al frontend di fare polling o usare WebSocket per il risultato.

2. **Scelta di FastAPI rispetto a Django/Flask**  
   FastAPI è stato selezionato per il suo supporto nativo all'asincronia (`async`/`await`) e per la generazione automatica della documentazione OpenAPI (Swagger), fondamentale per un'architettura che potrebbe evolvere verso un ecosistema di microservizi più ampio e per l'integrazione con team frontend separati.

3. **Redis come Message Broker**  
   Sebbene RabbitMQ o Kafka siano alternative valide per code complesse o ad alto throughput, Redis è stato scelto per questo progetto per la sua leggerezza, facilità di configurazione in Docker Compose e prestazioni eccellenti per code di task semplici e transienti.

## Prerequisiti

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) installati e in esecuzione.
- Una API Key valida per [Groq](https://console.groq.com) (per l'analisi AI dei CV).

## Avvio Rapido (Quick Start)

L'intera infrastruttura (5 servizi) può essere avviata localmente con un singolo comando.

1. **Clona il repository**
   ```bash
   git clone https://github.com/fabio-cerundolo/humflow-demo.git
   cd humflow-demo
   ```

2. **Configura le variabili d'ambiente**
   Crea un file `.env` nella root del progetto basandoti su `.env.example`:
   ```env
   GROQ_API_KEY=la_tua_api_key_qui
   # Le altre variabili (DB, Redis, SMTP) sono preconfigurate per l'ambiente Docker locale
   ```

3. **Avvia l'infrastruttura**
   ```bash
   docker-compose up --build
   ```
   *Nota: Al primo avvio, Docker scaricherà le immagini e costruirà i container. Potrebbe richiedere alcuni minuti.*

4. **Accedi alle applicazioni**
   - **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Documentazione API (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **MailHog (Sandbox Email)**: [http://localhost:8025](http://localhost:8025)

## Struttura del Progetto

```text
humflow-demo/
├── frontend/                 # Applicazione React + TypeScript
│   ├── src/
│   └── package.json
├── backend/                  # Applicazione FastAPI
│   ├── app/
│   │   ├── api/              # Endpoint REST
│   │   ├── core/             # Configurazione e dipendenze
│   │   ├── models/           # Modelli Pydantic e SQLAlchemy
│   │   └── tasks/            # Definizione dei task Celery
│   ├── celery_worker.py      # Entry point del worker asincrono
│   └── requirements.txt
├── docker-compose.yml        # Orchestrazione dei 5 servizi
├── .env.example              # Template delle variabili d'ambiente
└── README.md
```

## Sicurezza e Best Practices

- **Gestione dei Segreti**: Le credenziali (API Key, DB password) non sono mai committate nel repository. In un ambiente di produzione, verrebbero iniettate tramite un Secrets Manager (es. AWS Secrets Manager, HashiCorp Vault) o variabili d'ambiente del orchestrator.
- **Validazione degli Input**: Tutti i payload in ingresso sono rigorosamente validati tramite Pydantic per prevenire injection e garantire l'integrità dei dati.
- **Isolamento della Rete**: I servizi Docker comunicano su una rete interna definita in `docker-compose.yml`, esponendo all'host solo le porte strettamente necessarie.

## Scalabilità Futura

L'architettura è già predisposta per la scalabilità orizzontale:
- È possibile aumentare il numero di istanze del worker Celery (`docker-compose up --scale worker=3`) per gestire picchi di upload di CV senza modificare il codice.
- Il database PostgreSQL può essere facilmente migrato verso un'istanza gestita (es. AWS RDS) con repliche di lettura per separare i carichi di scrittura e lettura.

## Licenza

Questo progetto è distribuito con licenza MIT. Vedere il file `LICENSE` per i dettagli.

## Autore

**Fabio Cerundolo** — Web Solution Architect & Full-Stack Developer

- Portfolio: [fabio-cerundolo.dev](https://fabio-cerundolo.dev)
- GitHub: [@fabio-cerundolo](https://github.com/fabio-cerundolo)
- LinkedIn: [fabio-cerundolo](https://linkedin.com/in/fabio-cerundolo)
