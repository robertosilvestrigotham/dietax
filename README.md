# DietaX — Meal Planner PWA

Web application moderna, veloce ed elegante in stile macOS per la gestione del piano alimentare settimanale e la generazione automatica della lista della spesa.

Progettata principalmente per l'uso su **Mac**, con supporto reattivo completo per **iPhone** e funzionalità **PWA offline**.

---

## Caratteristiche Principali

1. **Oggi (`/`)**
   - Data corrente e giorno della settimana in formato italiano.
   - I 5 pasti previsti: Colazione, Spuntino, Pranzo, Merenda, Cena.
   - Spunta discreta dei pasti consumati con memorizzazione automatica dell'orario.
   - Avanzamento percentuale giornaliero e indicatore numerico (es. `3/5`).
   - Campo note del giorno con salvataggio automatico.
   - Navigatore temporale: giorno precedente, giorno successivo, salto a "Oggi" e selettore data.

2. **Settimana (`/settimana`)**
   - Panoramica dei 7 giorni della settimana (da Lunedì a Domenica).
   - Selettore giorni rapido con indicatore "Oggi".
   - Doppia modalità: **Dettaglio giorno** (per modificare i singoli pasti) e **Tutti i 7 giorni** (vista d'insieme).
   - Modifica completa dei pasti: nome slot, descrizione, note di preparazione, pasti fuori casa.
   - Editor strutturato per ingredienti: quantità, unità (`g`, `ml`, `pz`, `q.b.`), categoria e stato di preparazione (`a secco`, `cotto e scolato`, `al naturale`).

3. **Spesa (`/spesa`)**
   - Aggregazione intelligente di tutti gli ingredienti del piano per intervallo di date (default: settimana corrente Lun-Dom).
   - Distinzione rigorosa tra preparazioni incompatibili (es. riso/pasta crudi a secco vs legumi cotti e scolati).
   - Esclusione automatica degli ingredienti dei pasti fuori casa.
   - Gestione delle alternative con selezione interattiva in tempo reale (es. *Giovedì Merenda: Barretta proteica o Shaker whey*; *Domenica Merenda: Yogurt o Whey*; *Domenica Cena: Orata o Merluzzo*).
   - Segnare i pasti come consumati **non** elimina gli ingredienti dalla spesa.
   - Stati per ogni ingrediente: **Da acquistare**, **Acquistato**, **In dispensa**.
   - Possibilità di aggiungere prodotti manuali extra con relativa categoria.
   - Filtri rapidi e opzione *"Nascondi già in dispensa"*.
   - Pulsante **Copia testo** (formattato per Note / WhatsApp) e pulsante **Stampa** ottimizzato.

4. **Impostazioni (`/impostazioni`)**
   - Scelta tema: **Chiaro**, **Scuro** o **Sistema** con commutazione istantanea macOS.
   - Esportazione completa di backup in formato JSON (piano, progressi, preferenze).
   - Importazione di backup JSON con validazione schema.
   - Configurazione degli alimenti sempre presenti in dispensa.
   - Ripristino del menù iniziale seed senza perdere lo storico dei pasti consumati.
   - Reset dello storico dei pasti completati con richiesta di conferma.

---

## Stack Tecnologico

- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3 Composition API, Nitro, Vite)
- **Linguaggio**: TypeScript (tipizzazione rigorosa con `tsc` e `vue-tsc`)
- **Stile e UI**: [Tailwind CSS](https://tailwindcss.com/) (design system minimalista ispirato alle app native macOS)
- **Icone**: `@lucide/vue`
- **State Management**: [Pinia](https://pinia.vuejs.org/) con persistenza in `localStorage` client-only (zero errori di hydration SSR)
- **PWA & Offline**: `@vite-pwa/nuxt` (Service Worker, Web App Manifest, icone PWA conformi)
- **Test Unitari**: [Vitest](https://vitest.dev/)

---

## Menù Iniziale Precaricato (Seed)

Le quantità di pasta, riso e avena sono a secco; quelle dei legumi sono da prodotto cotto e scolato.

- **Lunedì**:
  - *Colazione*: 200 ml latte, 40 g pane integrale.
  - *Spuntino*: 1 mela e 15 g mandorle.
  - *Pranzo*: 90 g pasta integrale, 150 g ceci cotti, pomodorini (q.b.).
  - *Merenda*: 25 g whey con acqua.
  - *Cena*: 200 g merluzzo, 250 g patate, zucchine (q.b.).
- **Martedì**:
  - *Colazione*: 200 ml latte, 40 g avena.
  - *Spuntino*: 1 banana piccola.
  - *Pranzo*: 90 g riso basmati, 150 g ceci, verdure (q.b.).
  - *Merenda*: 25 g whey con acqua.
  - *Cena*: 180 g pollo, 70 g pane integrale, insalata (q.b.).
- **Mercoledì**:
  - *Colazione*: 200 ml latte, 40 g pane integrale.
  - *Spuntino*: 1 pera, 15 g mandorle.
  - *Pranzo*: 90 g pasta, 100 g tonno al naturale, pomodoro (q.b.).
  - *Merenda*: 170 g yogurt bianco.
  - *Cena*: 2 uova, 150 g fiocchi di latte, 70 g pane integrale, spinaci (q.b.).
- **Giovedì**:
  - *Colazione*: 200 ml latte, 40 g fette biscottate.
  - *Spuntino*: un frutto a scelta (q.b. / da definire).
  - *Pranzo*: **Fuori casa, pasto flessibile** (escluso dalla spesa).
  - *Merenda*: Barretta proteica oppure shaker whey (alternativa selezionabile).
  - *Cena*: **Fuori casa, pasto flessibile** (escluso dalla spesa).
- **Venerdì**:
  - *Colazione*: 200 ml latte, 40 g avena.
  - *Spuntino*: 1 mela, 15 g mandorle.
  - *Pranzo*: 90 g pasta, 150 g fagioli cannellini, pomodoro (q.b.).
  - *Merenda*: 25 g whey con acqua.
  - *Cena*: 180 g salmone, 250 g patate, verdure (q.b.).
- **Sabato**:
  - *Colazione*: 200 ml latte, 40 g pane integrale.
  - *Spuntino*: 1 banana piccola.
  - *Pranzo*: 90 g pasta, 100 g tonno al naturale, pomodorini (q.b.).
  - *Merenda*: 25 g whey con acqua.
  - *Cena*: 180 g tacchino, 70 g pane integrale, verdure (q.b.).
- **Domenica**:
  - *Colazione*: 200 ml latte, 40 g avena.
  - *Spuntino*: 1 pera, 15 g mandorle.
  - *Pranzo*: 90 g riso, 150 g ceci, zucchine (q.b.).
  - *Merenda*: Yogurt naturale oppure 25 g whey (alternativa selezionabile).
  - *Cena*: 200 g orata oppure merluzzo (alternativa selezionabile), 250 g patate, insalata (q.b.).

---

## Requisiti

- **Node.js**: v18.18+ (testato con successo su Node v22.22)
- **Package manager**: `pnpm` (consigliato v10+)

---

## Installazione e Avvio in Locale

1. **Installazione dipendenze**:
   ```bash
   pnpm install
   ```

2. **Avvio del server di sviluppo**:
   ```bash
   pnpm dev
   ```
   L'applicazione sarà disponibile su `http://localhost:3000`.

3. **Esecuzione dei test unitari (Vitest)**:
   ```bash
   pnpm test
   ```

4. **Verifica statica dei tipi (TypeScript)**:
   ```bash
   pnpm run typecheck
   ```

5. **Compilazione per produzione**:
   - Build server Node:
     ```bash
     pnpm run build
     pnpm run preview
     ```
   - Build statica PWA:
     ```bash
     pnpm run generate
     ```

---

## Come installare come PWA su Mac e iPhone

### Su Mac (macOS Sonoma, Sequoia o versioni recenti)

#### Metodo 1: Safari (Consigliato per esperienza nativa macOS)
1. Apri l'applicazione in **Safari** all'indirizzo locale o al tuo URL di deploy.
2. Dal menu in alto, seleziona **File** > **Aggiungi al Dock...** (oppure clicca sul pulsante Condividi nella barra degli strumenti e scegli *Aggiungi al Dock*).
3. Conferma il nome (es. `DietaX`).
4. L'icona apparirà direttamente nel Dock di macOS e potrà essere aperta come una vera applicazione desktop nativa, con la propria finestra indipendente e supporto offline.

#### Metodo 2: Google Chrome / Microsoft Edge / Brave
1. Apri l'app nel browser.
2. Clicca sull'icona di installazione presente a destra nella barra degli indirizzi (icona a forma di computer con freccia in giù o icona più).
3. Clicca su **Installa**. L'app si aprirà in una finestra autonoma e comparirà nel tuo Launchpad / cartella Applicazioni.

---

### Su iPhone (iOS)

1. Apri l'app in **Safari** sul tuo iPhone.
2. Tocca l'icona **Condividi** (il quadrato con la freccia verso l'alto al centro della barra inferiore).
3. Scorri le opzioni e tocca **Aggiungi alla schermata Home**.
4. Tocca **Aggiungi** in alto a destra.
5. L'app verrà installata sulla Home con la sua icona ad alta risoluzione e si avvierà a schermo intero senza interfaccia del browser.

---

## Persistenza e Sincronizzazione Dati

- **Nessun backend né database esterno**: i dati vengono salvati unicamente nel `localStorage` del browser sul dispositivo in uso.
- **Privacy totale**: nessuna informazione personale o alimentare viene trasmessa a server terzi.
- **Trasferimento dati tra Mac e iPhone**:
  1. Sul Mac (o sul dispositivo di origine), vai su **Impostazioni** > **Esporta backup JSON**.
  2. Invia il file scaricato al tuo iPhone (es. via AirDrop, iCloud Drive o Messaggi).
  3. Sull'iPhone, apri DietaX, vai su **Impostazioni** > **Importa backup JSON** e seleziona il file.

---

## Nota Informativa e Disclaimer

DietaX è uno strumento personale per la gestione pratica e logistica dei pasti. Il menù iniziale è un piano organizzativo indicativo e **non costituisce una prescrizione medica, dietoterapica o nutrizionale**. L'applicazione non suggerisce modifiche alle terapie mediche né ai dosaggi di insulina.
