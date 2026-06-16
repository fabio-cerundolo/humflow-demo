# Implementazione del Design di humflowRealColor nel Progetto

Il progetto attuale (`humflow-demo`) ha un frontend funzionante basato su React 18, `react-scripts` (CRA), React Router DOM e connessione completa al backend FastAPI.
La cartella `humflowRealColor` contiene un prototipo statico con un design moderno, animazioni fluide tramite Framer Motion, una griglia bento-grid, supporto per dark mode e componenti Shadcn UI, strutturato con Vite e TanStack Start.

L'obiettivo è integrare questo nuovo design (`humflowRealColor`) all'interno del progetto reale.

## User Review Required

> [!IMPORTANT]
> Dobbiamo decidere quale approccio seguire per integrare `humflowRealColor`:
>
> 1. **Opzione A (Consigliata per fedeltà al design): Sostituire il frontend con la struttura di `humflowRealColor`**
>    * Sostituiamo interamente la cartella `frontend` con il codice di `humflowRealColor`.
>    * Convertiamo `humflowRealColor` da statico a dinamico collegando le chiamate API di login, caricamento CV, aggiornamento stati, ricerca ed eliminazione candidati al nostro backend FastAPI.
>    * Riconfiguriamo il `Dockerfile` e il `docker-compose.yml` per supportare il nuovo build/dev server basato su Vite.
>    * **Nota:** Nel prototipo di `humflowRealColor` mancano le viste specifiche di Skill Gap interattivo, Calendario Colloqui, Reportistica e GDPR. Se scegliamo questa opzione, dovremo ricreare/migrare queste viste all'interno del nuovo router TanStack.
>
> 2. **Opzione B: Applicare la palette colori, font e stili di `humflowRealColor` al frontend esistente**
>    * Manteniamo la struttura del frontend attuale (React, CRA, React Router DOM, file e componenti esistenti).
>    * Aggiorniamo la configurazione Tailwind (`tailwind.config.js`) e il file CSS (`frontend/src/index.css`) per aggiungere le variabili colore della palette "Real Color" (l'azzurro/viola del logo originale e le classi `emerald-deep`, `emerald-mid`, `gold`, `paper`) e i font (`Space Grotesk`, `DM Sans`, `JetBrains Mono`).
>    * Aggiorniamo le viste correnti del frontend per allinearle stilisticamente alla grafica del prototipo.

## Open Questions

> [!WARNING]
> **1. Quale Opzione preferisci adottare (Opzione A o Opzione B)?**
>
> **2. Chiarimento sulle Palette Colori:**
> Nel file `styles.css` del prototipo `humflowRealColor`, i colori sono impostati come segue:
> * `emerald-deep`: `#0f172a` (che in realtà è un grigio/blu scuro, non verde smeraldo)
> * `emerald-mid`: `#2563eb` (che in realtà è blu vivo)
> * `gold`: `#f59e0b` (arancione/oro)
> * `paper`: `#f8fafc` (grigio chiaro)
>
> Tuttavia, nel logo del brand (`logo.svg`), i colori sfumano tra `#5b8cff` (azzurro) e `#7c5cff` (viola). E in alcuni grafici del prototipo si usano `#0d7a5f` (vero verde smeraldo) e `#c9a84c` (vero oro/bronzo).
> * Preferisci mantenere le definizioni esatte del file `styles.css` del prototipo (slate-900 e blu-600) oppure vuoi che correggiamo `emerald-deep` e `emerald-mid` per usare i veri toni verde smeraldo (es. `#0d7a5f` e `#10b981`)?

## Proposed Changes

A seconda dell'opzione selezionata, i file da modificare cambieranno drasticamente:

### Se si sceglie l'Opzione A (Sostituzione del frontend + wiring API):

#### [NEW] [Dockerfile](file:///c:/Users/fabio.cerundolo/Documents/HumFlow/humflow-demo/frontend/Dockerfile) (adattato per Vite)
#### [MODIFY] [docker-compose.yml](file:///c:/Users/fabio.cerundolo/Documents/HumFlow/humflow-demo/docker-compose.yml) (porta e comandi di avvio frontend)
#### [MODIFY] [__root.tsx](file:///c:/Users/fabio.cerundolo/Documents/HumFlow/humflow-demo/humflowRealColor/src/routes/__root.tsx) (aggiunta di autenticazione e provider)
#### [MODIFY] [index.tsx](file:///c:/Users/fabio.cerundolo/Documents/HumFlow/humflow-demo/humflowRealColor/src/routes/index.tsx) (sostituzione dati mock con chiamate axios/fetch reali)

---

### Se si sceglie l'Opzione B (Migrazione di stili e colori al frontend esistente):

#### [MODIFY] [tailwind.config.js](file:///c:/Users/fabio.cerundolo/Documents/HumFlow/humflow-demo/frontend/tailwind.config.js) (estensione colori con la palette di `humflowRealColor`)
#### [MODIFY] [index.css](file:///c:/Users/fabio.cerundolo/Documents/HumFlow/humflow-demo/frontend/src/index.css) (import dei font da Google Fonts e setup variabili CSS)
#### [MODIFY] [MainLayout.tsx](file:///c:/Users/fabio.cerundolo/Documents/HumFlow/humflow-demo/frontend/src/layout/MainLayout.tsx) (aggiornamento classi CSS con i nuovi colori)
#### [MODIFY] [DashboardView.tsx](file:///c:/Users/fabio.cerundolo/Documents/HumFlow/humflow-demo/frontend/src/views/DashboardView.tsx) (stile e colori bento-like)

## Verification Plan

### Automated Tests
* Eseguire il build del frontend (`npm run build` o `yarn build`) per verificare l'assenza di errori TypeScript o CSS.

### Manual Verification
1. Avvio completo dell'infrastruttura con `docker-compose up --build`.
2. Accesso a `http://localhost:3000` per verificare il caricamento del nuovo design.
3. Test di caricamento di un file CV reale per verificare che l'analisi proceda correttamente e i dati vengano mostrati con il nuovo stile.
4. Test del toggle dark/light mode.
