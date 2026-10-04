# KNOWLEDGE

> Registro di ciò che è stato fatto e delle ragioni dietro le scelte.
> **Aggiornalo a ogni sessione**, in cima alla sezione "Log", e quando prendi una decisione che
> qualcuno dovrà capire tra sei mesi.

## Stato corrente

Boilerplate funzionante e verificato. Una stanza (Sala Prove), cinque arredi ispezionabili
(batteria, due amplificatori per chitarra, uno per basso, porta), movimento con collisioni, camera
che segue il personaggio, HUD con dialoghi. **Navigazione punta-e-clicca**: click o tap sul
pavimento per camminare, click o tap su un arredo per andarci e esaminarlo, con percorso calcolato
sulla griglia (A*). Nessun joystick, nessun bottone touch: su telefono si usa la stessa cosa del
desktop. Build statica pubblicabile su GitHub Pages. Nessuna meccanica di gioco ancora: è un
impianto, non un gioco.

Ultima verifica: 4 ottobre 2026 — `npm run lint` pulito, `npm run build` ok, `npm run build:single`
ok e aperto da `file://`; 49/49 verifiche sul dev server (click, percorso attorno agli arredi,
tastiera che annulla la destinazione, tap in landscape e portrait con dita emulate via CDP) e
15/15 smoke test sulla build single-file da `file://`.

## Vincoli e desideri (dal brief iniziale)

- Phaser 3, JavaScript puro.
- Deploy statico su GitHub Pages.
- RPG classico visto dall'alto, riferimento Office Town.
- Solo una stanza, in legno: una sala prove con batteria, due amplificatori per chitarra, uno per
  basso.
- La documentazione deve tenere traccia del lavoro: questo file.

## Decisioni prese (e perché)

| Decisione | Motivo |
| --- | --- |
| **Vite + npm** invece di no-build con Phaser vendorizzato | HMR, moduli ES, un solo `npm run build`. Con `base: './'` l'output funziona su GitHub Pages sia come sito utente sia come project site. |
| **Phaser 3.90.0**, non Phaser 4 | Richiesta esplicita. È l'ultima 3.x. |
| **Grafica generata a runtime** invece di PNG | Zero asset nel repo, zero licenze, e i nomi delle chiavi texture sono già quelli che serviranno ai PNG veri: si sostituisce il disegno, non il codice che lo usa. |
| **Layout della stanza in JSON** | Cambiare arredi e muri senza toccare il codice. È la scelta che rende il boilerplate utile. |
| **Pavimento e muri su canvas, arredi e personaggio con `Graphics.generateTexture`** | Il pavimento grande deve essere una sola texture (960×640) invece di 600 sprite; gli arredi devono restare sprite separati per il depth sorting. |
| **Umani, non NPC** | Il brief chiedeva una stanza, non un mondo. |
| **Interazione solo descrittiva** | Scelta esplicita: il testo dialoghi c'è, la meccanica no. Il `InteractionSystem` è già il punto in cui innestare il gameplay. |
| **Bus di eventi per HUD e gameplay** | `HudScene` non conosce `RoomScene` e viceversa. Aggiungere un pannello o una schermata non richiede di toccare il gameplay. |
| **HUD e dialoghi in una `HudScene` separata** | L'HUD sopravvive al cambio stanza e si può spegnere da solo. |
| **ESLint con config flat** | Poco codice, ma `npm run lint` deve stare in zero errori o non serve a niente. |
| **Viewport 960×540, stanza 960×640** | La stanza è larga quanto lo schermo e più alta: si vede subito che la camera scorre, senza dover rimpicciolire la stanza per far entrare tutto. |
| **Tile 32 px** | Coerente con lo stile "cubi" di Office Town e con una griglia comoda. |
| **`depth = y` per arredi e personaggio** | Il depth sorting classico del top-down: chi è più in basso davanti. |
| **Collisioni come `Rectangle` invisibili con `physics.add.existing(rect, true)`** | Un corpo statico delle esatte dimensioni del rettangolo, senza dover gestire `origin`, `offset` e `refreshBody`. |
| **Muri uniti in corse orizzontali** | 39 corpi al posto di 188 celle. |
| **Nessun code-splitting** | Il bundle è un solo file da ~330 kB gzip: gioco statico, priorità alla semplicità. |
| **Due build: `dist/` e `dist-single/`** | `dist/index.html` non parte da `file://` (CORS sugli script modulo ES): la build normale va servita over http (`npm run preview`), quella single-file si apre con doppio clic. Vite 8 rifiuta i flag CLI sconosciuti, quindi la scelta si fa con `--mode single`. |
| **Nessun font esterno** | I font web aggiungono una richiesta di rete e una `FOUT`: si usa la stack di sistema. |
| **Rilevamento touch con `matchMedia('(pointer: coarse)')`, in `src/core/input.js`** | È la domanda giusta ("il puntatore principale è un dito?"). `device.input.touch` di Phaser sbaglia: risulta vero anche su molti portatili touch-capable. Serve solo per le **parole** della legenda e dell'hint: nessun ramo di gameplay legge il touch, perché il click è già un input unico per mouse e dito. `?touch=1` tiene la legenda da touch raggiungibile a mano per le prove. |
| **Click/tocca-e-vai al posto del joystick** | Il joystick virtuale rendeva la metà destra dello schermo morta e aggiungeva un bottone da schivare; il tap è già il linguaggio naturale di un RPG top-down e funziona su desktop senza cambiare idea. Con il pathfinding non si perde in precisione: si sceglie un punto, non una direzione. |
| **Percorso A\* sulla griglia (`src/game/navigation.js`)** | In linea retta il personaggio si incastra contro gli arredi e resta fermo a metà strada, che su un telefono sembra un bug. La griglia camminabile (muri fuori, ingombri gonfiati del raggio del personaggio) è 30×20: la ricerca è immediata e si può evitare di tagliare gli angoli. |
| **Il tap su un arredo non è un comando a distanza** | Il tap arma un bersaglio, il personaggio ci va, e `resolvePending()` apre il dialogo solo quando è dentro `interactRange`. Un dialogo che compare a schiocco mentre il personaggio è dall'altra parte della stanza rompe l'illusione. |
| **Un tasto premuto annulla la destinazione** | La tastiera vince sempre sul click: dopo un tocco si può correggere la rotta senza dover prima completare il cammino. |
| **Il dialogo aperto "mangia" il tocco** | Con un dialogo aperto il tocco avanza il testo e non imposta nuove destinazioni: la regola è identica a `E`/`INVIO` da tastiera, e il gameplay non si blocca (decisione già presa: il movimento resta libero). |
| **`Events.INTERACT_REQUESTED` rimosso** | Serviva solo al bottone touch. Ora l'interazione parte da `pointerdown` in `RoomScene` o dalla tastiera: due punti di ingresso nella scena, nessun evento bus che attraversa l'HUD per arrivare al gameplay. |

## Trapphigli di Phaser incontrati (leggere prima di debuggare)

1. **`addKeys` con un array non dà un array di `Key`.**
   `addKeys({ up: ['W','UP'] })` restituisce `{ up: { W: Key, UP: Key } }`. Va trasformato in
   azioni con `isDown`: è quello che fa `src/core/input.js`.

2. **`Graphics.generateTexture` non crea i frame.**
   `generateFrameNumbers('player', ...)` su una texture generata così fallisce con
   `Frame "N" not found`. I frame si aggiungono a mano con `texture.add(i, 0, x, y, w, h)`
   (`src/gfx/textureFactory.js`).

3. **`world.drawDebug = true` senza `createDebugGraphic()`** → `TypeError: ... reading 'clear'` a
   ogni frame in `World.postUpdate`. Va chiamato prima `world.createDebugGraphic()`
   (`RoomScene.toggleDebug`).

4. **`callbacks.postBoot` viene eseguito DOPO l'evento `READY`.**
   Registrarci dentro `game.events.once(READY, ...)` non scatta mai. Per nascondere l'overlay di
   caricamento si usa `POST_RENDER`.

5. **Phaser ha `width`/`height` di default 1024×768.**
   Dimenticarli nella config fa partire tutto con dimensioni sbagliate: la stanza risulta più piccola
   dello schermo e la camera non si muove.

6. **Le palette nei JSON sono esplicite, non parziali.**
   `withAlpha(palette.light, ...)` con una chiave mancante dà
   `Cannot read properties of undefined (reading 'replace')`. Se aggiungi un colore alla palette,
   controlla tutti i consumer in `roomTextures.js`.

7. **`input.keyboard.addKey(code, false, false)`** disattiva la cattura degli eventi della pagina:
   senza questo, `SPAZIO` e le frecce fanno scrollare il browser.

8. **Vite 8 rifiuta i flag CLI non riconosciuti** (`CACError: Unknown option`), quindi non si può
   fare `vite build --singleFile` per passare un'opzione alla config. Si usa `--mode single`, che
   la funzione config riceve normalmente.

9. **Aprire `dist/index.html` con doppio clic non funziona e sembra un bug del gioco.** Su
   `file://` i browser bloccano i `<script type="module">` esterni per policy CORS: la pagina resta
   sull'overlay "caricamento" senza un solo errore in console. Non è un problema di Phaser. Per
   questo esiste `build:single`, che inietta il bundle dentro l'HTML (`inlineEntryScript` in
   `vite.config.js`): uno script modulo **inline** non è soggetto a quel controllo.

10. **`world.drawDebug = false` da solo NON cancella i corpi di collisione disegnati.**
    `World.postUpdate` chiama `debugGraphic.clear()` **solo dentro** `if (this.drawDebug)`: spento il
    flag, il `Graphics` resta con l'ultimo frame disegnato e quei rettangoli rimangono a schermo per
    sempre. Sembra che il debug sia "semi attivo". Va pulito a mano:
    `world.drawDebug = false; world.debugGraphic.clear();` (`RoomScene.toggleDebug`).

11. **Phaser 3.90 non ascolta gli eventi Pointer: ascolta `mouse*` e `touch*`.**
    `MouseManager` si registra su `mousemove/mousedown/mouseup`, `TouchManager` su
    `touchstart/touchmove/touchend/touchcancel`; i `Pointer` di Phaser sono un astretto sopra
    questi due. Dispataccare `new PointerEvent('pointerdown')` da un test **non muove nulla** e sembra
    un bug del codice. Con Playwright si emulano i dita veri con CDP:
    `Input.dispatchTouchEvent` (`touchStart` / `touchMove` / `touchEnd`).

12. **Gli screenshot con `clip` di un canvas WebGL tornano neri.** `page.screenshot({ clip })` su un
    canvas accelerato cattura una superficie vuota, mentre lo screenshot a pagina intera è
    corretto. E contare "pixel chiari" non serve a nulla se lo sfondo è il parquet. Il metodo che
    funziona: due screenshot a pagina intera, differenza pixel per pixel e conta delle differenze
    per zona.

13. **`flex` sul contenitore + `autoCenter` di Phaser = canvas storto.** Phaser centra il canvas con
    `marginLeft`/`marginTop` calcolati sul viewport. Se anche il CSS `#app` è un contenitore flex
    centrato, il canvas viene centrato due volte: in landscape `844×390` il rettangolo misurava
    `[113, 0, 693, 390]`, cioè 113 px di margine a sinistra e 38 a destra, e il bordo destro sembrava
    "morto". Nel CSS del contenitore non deve esserci `display: flex` con `justify-content: center`.

14. **Il punto di arrivo va calcolato sulla griglia, non sul pixel toccato.** Con un click sul muro il
    personaggio finiva con la faccia contro il muro e `moveTarget` mai azzerato: restava lì, e il
    test sembrava un bug di collisione. `nearestWalkableCell` sposta la destinazione sulla cella
    libera più vicina; per un arredo la cella deve anche essere entro `interactRange`.

15. **Rilevamento di ostacolo: meglio la distanza al waypoint corrente che quella all'origine.** Se il
    timer di "bloccato" confronta la distanza dalla partenza, un waypoint appena raggiunto e subito
    superato fa sembrare il personaggio fermo (la distanza torna a crescere) e il cammino viene
    cancellato a metà. Il riferimento va azzerato a ogni cambio di waypoint.

16. **`body.reset(x, y)` per spostare il personaggio nei test** teletrasporta senza passare dalla
    collisione, ma la camera segue il personaggio in lerp: il click va calcolato **dopo** che la
    camera si è fermata, altrimenti lo schermo è ancora quello vecchio e il test clicca il punto
    sbagliato. Meglio aspettare che `scrollX/scrollY` siano stabili prima di convertire le
    coordinate.

## Log delle sessioni

### 2026-10-04 — Sessione 1: impianto e prima stanza

Fatto:

- Scaffold Vite + Phaser 3.90 + ESLint, con `base: './'`, `public/.nojekyll`, workflow
  `.github/workflows/pages.yml` per GitHub Pages.
- Config globale in `src/config.js` (dimensioni, controlli, velocità, font).
- Bus di eventi (`core/eventBus.js`), stato UI condiviso (`core/uiState.js`), helper per i tasti
  (`core/input.js`).
- `RoomScene` che costruisce tutto da `src/data/rooms/sala-prove.json`: griglia 30×20, muri di
  perimetro, apertura della porta, 39 corpi statici per i muri e 4 per gli arredi.
- `Player` con 4 direzioni × 4 frame (idle + 3 di camminata) generati in un unico foglio 128×160,
  corpo di collisione 18×12, ombra.
- `Prop` come `Container` (ombra + sprite) con `depth = y` e corpo statico opzionale.
- Texture disegnate a runtime: parquet con venature e nodi, muri con spessore e luce, batteria
  (cassa, due tom, floor tom, rullante, charleston, due piatti, sgabello), due amplificatori
  per chitarra e uno per basso, porta in legno con maniglia in ottone.
- `HudScene`: targa stanza, coordinate, legenda, hint contestuale, toast.
- `DialogueBox`: riquadro in legno, titolo e testo mostrati subito insieme, coda di messaggi,
  chiusura con `E` o click.
- `InteractionSystem`: trova l'arredo più vicino entro 78 px ed emette la sua descrizione.
- Documentazione: questo README, `docs/KNOWLEDGE.md`, `docs/GAME-DESIGN.md`.

Verifiche fatte (headless, con Playwright puntato a Edge, fuori dal repo):

- il personaggio cammina nelle 4 direzioni, le animazioni cambiano, la camera insegue e si ferma ai
  bordi (scrollY clampato a 100);
- le collisioni funzionano: fermo a `y = 204` contro la batteria, a `x = 41` contro il muro ovest,
  a `y = 608` contro il muro sud, `x = 919` contro il muro est;
- l'hint compare vicino agli arredi e sparisce lontano;
- i dialoghi si aprono con il nome giusto e si chiudono;
- `G` attiva griglia e corpi di collisione senza errori;
- le texture non sono vuote e hanno il contenuto atteso (batteria 168×124 con 103 colori distinti);
- `dist/` servito staticamente: HTTP 200, canvas 960×540, nessuna richiesta fallita, overlay rimosso;
- `dist-single/index.html` aperto direttamente da `file://`: parte, canvas 960×540, zero errori.

Errori trovati e corretti durante il lavoro: la struttura dei tasti con `addKeys`, i frame mancanti
sul foglio del personaggio, `createDebugGraphic`, il boot listener su `READY`, le dimensioni di
default del game, la chiave `light` mancante nella palette dei muri, e la build che sembrava
"rotta" aprendo `dist/index.html` dal disco (era CORS sui moduli ES, non Phaser).

### 2026-10-04 — Sessione 2: `build:single`, debug e smartphone

Fatto:

- **`build:single`** (`vite.config.js`, `--mode single`): il bundle finisce dentro l'HTML, così il
  gioco si apre con doppio clic. `build:single/index.html` non esiste: l'output è `dist-single/`.
- **Bug `G`**: spegnere il debug non nascondeva più i corpi di collisione (vedi trabocchetto 10).
  Ora il toggle pulisce griglia e `debugGraphic`.
- **Controlli touch** (`src/systems/touchControls.js`): joystick che nasce dove tocchi nella metà
  sinistra, sprint a deflessione massima, bottone `E` fisso in basso a destra, due dita
  contemporanee, legenda e hint che si adattano.
- `Player` unisce tastiera e joystick in un unico vettore di movimento; `Events.INTERACT_REQUESTED`
  collega il bottone touch alla stessa azione di `E`.
- `index.html`: `overscroll-behavior`, `touch-action`, `user-select` e
  `-webkit-tap-highlight-color` per eliminare scroll, zoom e flash azzurro sui dispositivi touch.

Verifiche fatte (headless, Edge, eventi touch veri via CDP `Input.dispatchTouchEvent`):

- `G` ON → 1596 comandi nel `debugGraphic`, OFF → 0, e il ciclo si ripete pulito;
- joystick: comparsia al tocco, deflessione piena = 205 px/s (sprint), metà = 70 px/s, alto e basso,
  rilascio che ferma il personaggio e nasconde il joystick;
- due dita insieme: joystick (`id 1`) e bottone (`id 2`) attivi contemporaneamente, il player
  continua a camminare mentre il bottone viene premuto;
- bottone `E` apre il dialogo, completa il testo e lo chiude; con il dialogo aperto il tocco a
  sinistra avanza il testo e non muove il personaggio;
- desktop: nessun joystick, legenda da tastiera, `WASD` e `SHIFT` invariati, il tocco non muove
  nulla;
- `dist-single/index.html` da `file://`: con emulazione touch i controlli compaiono da soli
  (identici a `?touch=1`), 2992 pixel diversi nell'area del bottone, 721 nella legenda spostata in
  alto, 365 nella posizione vecchia, **0** nel mondo di gioco.

> Il joystick della Sessione 2 è stato **rimosso** nella Sessione 3: le scelte qui sopra lo
> sostituiscono, non lo correggono.

### 2026-10-04 — Sessione 3: niente joystick, click e tap

Fatto:

- **Rimosso `src/systems/touchControls.js`** con il joystick e il bottone `E`, e con essi
  `Events.INTERACT_REQUESTED` e `scene.input.addPointer(2)`.
- **Click/tap = un solo input** per desktop e telefono: `RoomScene` ascolta `pointerdown`, lo
  traduce in punto del mondo con `cameras.main.getWorldPoint(...)` e lo assegna al pavimento o
  all'arredo colpito (`InteractionSystem.hitTest`, raggio metà diagonale dell'ingombro + 14 px).
- **`src/game/navigation.js`**: griglia camminabile (muri esclusi, ingombri degli arredi gonfiati di
  `bodyWidth/2`) e A* a 8 direzioni senza tagliare gli angoli, più `nearestWalkableCell` per il punto
  di arrivo e `cellsToPoints` per i waypoint.
- **`Player`**: `walkTo`/`followPath` con lista di waypoint, arrivo a 5 px, e un timer di "bloccato"
  (420 ms senza avvicinarsi al waypoint corrente) che azzera il cammino invece di spingere contro
  i muri per sempre. La tastiera annulla la destinazione.
- **`RoomScene.resolvePending()`**: il dialogo dell'arredo si apre quando il personaggio entra in
  portata, non appena parte il cammino. Toccare la batteria da lontano la fa attraversare la stanza
  e poi descriversi.
- **`isTouchPrimary()`** in `src/core/input.js`: serve solo a cambiare le parole di legenda e hint
  (`tocca dove vuoi andare` invece di `WASD muoviti`).
- **`index.html`**: tolto il `flex` centrato da `#app`, lasciando a Phaser il centro del canvas
  (vedi trabocchetto 13).

Verifiche fatte (headless, Edge; dita emulate via CDP `Input.dispatchTouchEvent`):

- click sul pavimento: partenza, arrivo sul punto, fermo; nuovo click durante il cammino cambia la
  destinazione; `A` durante il cammino annulla la destinazione e riprende il controllo manuale;
- percorso che aggira la batteria e arriva dietro senza incastrarsi; click sul muro: si ferma davanti;
- click su batteria, porta e amplificatore: il personaggio arriva e il dialogo si apre da solo,
  con il nome giusto; click sul vuoto: cammina e non apre nulla;
- smartphone landscape `844×390` e portrait `390×844`: canvas centrato (margini simmetrici a 1 px),
  tap in zone diverse dello schermo, tap sulla batteria con dialogo, legenda da touch;
- `G` ON → 1596 comandi, OFF → 0;
- `dist-single/index.html` da `file://`: 15/15 smoke test (nessun errore in console nelle varianti
  desktop / `?touch=1` / touch reale, canvas 960×540, overlay rimosso, centraggio, legenda).

### 2026-10-04 — Sessione 4: tieni premuto per camminare, tocca per esaminare

Fatto:

- **Tenere premuto ora guida, non interagisce.** `RoomScene` ascolta `pointerdown`, `pointermove`,
  `pointerup` e `pointerupoutside`. Finché il puntatore è giù, `pointermove` ricalcola la
  destinazione (`steerTo`) e `pendingProp` resta `null`: nessun dialogo può partire, nemmeno
  passando sopra un arredo. Il trascinamento si distingue dal tocco con `TAP_SLOP = 12` px misurati
  fra il punto di `pointerdown` e quello di `pointerup`: se il puntatore è restato fermo, il tocco
  arma l'arredo sotto al dito e il dialogo parte all'arrivo come prima.
- **Stato del gesto in `this.drag`** (`id`, `x`, `y`, `blocked`): `id` perché con più dita sullo
  schermo solo il puntatore che ha iniziato il gesto può continuare a guidare; `blocked` perché un
  tocco iniziato mentre un dialogo è aperto non deve armare nulla al rilascio, altrimenti chiudere
  il dialogo con un tocco farebbe ripartire l'interazione.
- **Il tasto destro del mouse è ignorato** (`pointer.rightButtonDown()`), così il contestuale del
  browser non teleguida il personaggio. Il metodo esiste in Phaser 3.90 e controlla il bit 2 di
  `pointer.buttons`, quindi è affidabile anche per il touch (che ha `buttons = 1`).
- **Dialogo senza macchina da scrivere**: `DialogueBox.openNext()` imposta subito
  `body.setText(next.text)` e `continueMark.setAlpha(1)`; eliminati `CHARS_PER_SECOND`,
  `revealed`, `applyReveal()`, `isFullyRevealed` e il parametro `delta` in `update()`. Titolo e
  descrizione ora compaiono nello stesso frame. `advance()` è passato da tre casi (completare,
  poi prossimo, poi chiudere) a due, e la `▼` continua a pulsare per far capire che si può
  proseguire.

Verifiche fatte (headless, Edge; dita emulate via CDP `Input.dispatchTouchEvent`):

- `held.mjs`: **29/29**. Copre: tap breve che ancora arma l'arredo e apre il dialogo arrivando;
  tenere premuto sopra la batteria senza dialogo né `pendingProp`; trascinamento con mouse e col
  dito che continua a camminare; rilascio del trascinamento che non apre nulla; tap successivo che
  apre il dialogo; titolo e testo completi in contemporanea; tocco che chiude il dialogo senza
  ri-armare l'arredo; `KeyD` che annulla la destinazione; landscape `844×390` con canvas
  centrato e legenda da touch;
- `pointclick.mjs`: **49/49**, nessuna regressione sul click-per-interagire.

### 2026-10-04 — Sessione 5: modalità portrait con risoluzione dinamica e telecamera adattiva

Fatto:

- **Risoluzione dinamica e cambio di orientamento istantaneo**:
  - `src/config.js` espone `isPortraitMode()` e `getGameResolution()` con risoluzioni dedicate: `960 × 540` (zoom 1.0) per landscape e `540 × 960` (zoom 1.5) per portrait.
  - In `src/main.js`, Phaser si avvia con la risoluzione corrispondente all'orientamento dello schermo all'apertura (`window.innerHeight > window.innerWidth`).
  - Gli eventi `resize` e `orientationchange` su `window` aggiornano al volo `game.scale.setGameSize(...)` senza ricaricare la pagina o perdere lo stato del gioco.
- **Telecamera adattiva in `RoomScene`**:
  - In landscape: la stanza (larghezza 960 px) entra per intero in orizzontale, la telecamera segue il giocatore in verticale (altezza 540 px vs 640 px di stanza).
  - In portrait: la stanza (altezza 640 px) entra per intero in verticale (`960 / 1.5 = 640` px di mondo visibile), la telecamera segue il giocatore in orizzontale (`540 / 1.5 = 360` px di mondo visibile). Nessuna banda nera o vuoto fuori dai muri della stanza.
  - Al resize, `RoomScene` aggiorna lo zoom della telecamera (1.5 in portrait, 1.0 in landscape).
- **Interfaccia e riquadro dialoghi responsive**:
  - `DialogueBox`: la larghezza si adatta dinamicamente (`boxWidth <= 500` in portrait, `760` in landscape) e l'altezza aumenta leggermente (170 px) per il testo a capo; il riquadro è centrato e posizionato sul fondo dello schermo.
  - `HudScene`: targa coordinate, hint, legenda e toast ricalcolano la propria posizione ad ogni evento di resize (`layoutElements()`).

Verifiche fatte:
- `test_orientation.mjs`: **13/13** (avvio diretto portrait 390×844, zoom 1.5, tocco arredo e apertura dialogo responsivo, rotazione dinamica a landscape 960×540 e ritorno a portrait).
- `pointclick.mjs`: **49/49** (pathfinding, aggiramento ostacoli, tap e arrivo a destinazione sia in landscape che in portrait).
- `held.mjs`: **29/29** (drag continuo mouse e touch, tap secco per arredo, annullamento da tastiera).
- `prod2.mjs`: **15/15** su `dist-single/index.html`.

## Come continuare

Checklist per la prossima sessione:

1. Leggere questo file e `README.md`.
2. `npm install`, `npm run dev`.
3. Prima di scrivere codice, decidere se la modifica tocca i dati (JSON) o il comportamento
   (codice), e annotare la decisione qui sotto.
4. Dopo: `npm run lint`, `npm run build`, e una passata a mano con i controlli qui sotto.
5. Aggiornare il log e la tabella delle decisioni.

Comandi di verifica:

```bash
npm run lint
npm run build
npm run preview         # poi aprire http://localhost:4173
npm run build:single    # apribile con doppio clic, per test rapidi
```

Se si vuole una verifica automatica, si può riusare l'approccio di queste sessioni: Playwright
installato con `npm install --no-save playwright`, lanciato con `channel: 'msedge'` (usa Edge già
presente sul sistema, nessun download di browser), uno script fuori dal repository che apre la
pagina, preme i tasti e legge `window.__game`. In dev il gioco è esposto su `window.__game`
(`src/main.js`, solo con `import.meta.env.DEV`).

Attenzione a tre cose che costano tempo, se si riscrive lo script di test:

- i click vanno calcolati **dopo** che la camera si è fermata (`body.reset` teletrasporta, la camera
  insegue in lerp): vedi trabocchetto 16;
- i dita si muovono con `context.newCDPSession(page)` e `Input.dispatchTouchEvent` (`touchStart`
  con la lista dei punti attivi, `touchMove` per spostarli, `touchEnd` con i punti **rimasti**);
- sulla build single-file `window.__game` non esiste: la verifica prodotta è uno smoke test
  deterministico (errori in console, dimensione canvas, overlay, centraggio, legenda). Il
  comportamento vero si verifica sul dev server.

Con `hasTouch: true` il contesto Playwright emula il dispositivo (il gioco si accorge da solo dalla
legenda), oppure `?touch=1` nell'URL forza le parole da touch.

## Glossario minimo

- **Stanza**: una scena di gioco descritta da un JSON in `src/data/rooms/`.
- **Arredo (prop)**: oggetto di scena con ombra, `depth = y` e ingombro opzionale.
- **Cella solida**: tile di griglia bloccata, derivata da `walls` meno `openings`.
- **Run**: sequenza orizzontale di celle solide, unita in un solo corpo di collisione.
- **Cella camminabile**: tile libera dove il personaggio ci sta davvero (muri esclusi, ingombri
  gonfiati del suo raggio). È la griglia su cui gira l'A* di `navigation.js`.
- **Waypoint**: un punto della sequenza che il personaggio segue; `Player` li consuma uno alla volta.
- **Profondità (`depth`)**: ordine di disegno. Pavimento −2000, muri −1000, arredi e personaggio il
  proprio `y`.