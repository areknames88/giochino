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

**Personaggi data-driven**: `src/gfx/characterArt.js` ha un solo `drawCharacterCell(g, cx, feetY,
look, facing, phase)` che disegna chiunque, e tutto l'aspetto arriva dai JSON in
`src/data/characters/playable/` e `src/data/characters/npc/`. `src/game/characters.js` è il registro:
valida, completa i valori mancanti e produce le chiavi `character-<id>` e
`character-<id>-{idle,walk}-<facing>`. `Player` non sa più nulla del personaggio: prende una texture,
un prefisso di animazioni e la scala dell'ombra.

**Schermata di scelta** (`CharacterSelectScene`): quattro schede con l'anteprima disegnata dagli
stessi dati del gioco, in landscape 4×1 e in portrait 2×2. Si conferma col bottone, con `INVIO`,
`SPAZIO` o `E`; `?char=<id>` la salta. La scelta resta nel registry, non viene salvata.

**Dialoghi a rami con box unica moderna e avatar**: ogni parlante ha un grafo JSON in
`src/data/dialogues/<id>.json` (`entries` con nodo d'ingresso per ascoltatore + `nodes` con
battute e risposte). Il riquadro `DialogueBox` è una box unica rifinita con bordo dorato, avatar
quadrato laterale generato a runtime (`avatar-<id>`), risposte elencate direttamente SOTTO il
testo con badge numerati (1–3), e riga di uscita con tasto `ESC`. Durante le conversazioni NPC il
movimento del giocatore è bloccato (`uiState.dialogueLocked`), mentre per gli arredi l'esplorazione
resta libera.

Ultima verifica: 6 ottobre 2026 — `npm run lint` pulito, `npm run build` ok (43 moduli),
`npm run build:single` ok; test funzionali Playwright su Edge di sistema (10/10 verifiche: texture
avatar, movimento libero iniziale, blocco movimento durante dialogo NPC, rendering opzioni e riga
uscita dentro la box, uscita con tasto ESC, ripristino movimento, uscita con click su riga Esci,
battuta giocatore con avatar dopo la scelta, e descrizione arredo senza avatar e senza blocco).

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
| **Personaggi descritti dai JSON, non scritti a mano** | Un `drawCharacterCell` generico con una `look` risolta (`palette`, `build`, stile capelli, stile outfit, effetti) tiene insieme corpo e accessori: aggiungere un personaggio o un look nuovo non tocca il codice, e lo stesso disegno serve per le anteprime e per il gioco. |
| **`playable/` e `npc/` come cartelle** | La differenza fra un personaggio scelto dal giocatore e uno che sta in stanza è una proprietà dei dati, quindi sta nei dati. I giocabili si generano tutti in `BootScene` (servono alle anteprime), gli NPC su richiesta, così gli asset non sprecati non si generano. |
| **Un file per personaggio** | Quattro righe di `characters.js` per un personaggio nuovo, e ogni JSON si può modificare da solo senza toccare gli altri. Gli id duplicati fanno fallire il boot, non producono texture sovrapposte. |
| **La `look` tiene i colori come stringhe `#rrggbb`** | I JSON sono dati: un colore leggibile e copiabile vale più di un numero. Chi disegna converte con `tint()` (`Phaser.Display.Color.HexStringToColor`), perché `fillStyle` con una stringa non dà errore, dà una cella **vuota** (trabocchetto 17). |
| **Celle 32×56 con i piedi a 3 px dal fondo** | I piedi restano fermi fra le direzioni (servono a `depth = y` e all'ombra) e l'altezza extra sopra la testa fa stare capelli lunghi e berretti anche sul personaggio più alto (`build.height` 1.15). |
| **Fasi `[0, +SWING, 0, -SWING]` e camminata `1,2,3,2`** | Le quattro celle della riga sono: fermo, passo destro, centro, passo sinistro. Prendendo solo `1,2,3` la clip finisce con due pose di contatto opposte e zoppica: il ritorno alla cella 2 prima di ripetere è la posizione di passaggio. |
| **Schermata di scelta con lo stesso disegno del gioco** | L'anteprima non è una foto statica: usa `drawCharacterCell` con la `look` del personaggio, quindi non può divergere da quello che si vede poi in stanza. La selezione è per sessione (registry), senza `localStorage`: lo stato del giocatore non è ancora modello. |
| **`?char=<id>` come override della scelta** | Provare i quattro personaggi senza cliccare quattro volte, e poter controllare in un colpo solo che le texture esistono tutte. Se l'id non è un giocabile, si ignora e parte il default. |
| **Dialoghi in file separati (`src/data/dialogues/`), non `reactions` nei JSON dei personaggi** | Personalizzare per ascoltatore richiede più di una riga: nei JSON dei personaggi significherebbe duplicare le battute quattro volte e logiche `if (listener === ...)` sparse ovunque. Un file per parlante, `entries` per chi ascolta, i JSON esistenti restano intatti. |
| **Grafo con `next` obbligatorio, niente codice nei JSON** | Ogni risposta dichiara il nodo successivo: il grafo è interamente verificabile all'avvio (tutti i `next` risolti, ascoltatori noti, max 3 risposte) invece di fallire a gioco in corso. Il runner prepone la battuta scelta al nodo aperto, così il testo in bocca al giocatore è sempre la stringa `text` dell'opzione. |
| **`DialogueRunner` separato da `InteractionSystem`** | `interaction.js` sa solo "qual è il bersaglio più vicino": la conversazione (nodo corrente, scelte, chiusura) è un altro gioco. I due ingressi (`E` e tap) chiamano la stessa `runner.start()`, senza eventi bus che attraversano l'HUD per arrivare al gameplay. |
| **`DIALOGUE_CLOSED` sul bus globale** | `close()` emetteva solo su `scene.events` dell'HUD: `RoomScene` non vedeva la fine naturale del dialogo e `dialogueTarget` restava appeso. Sul bus globale tutti chiudono in un punto solo; l'emettitore fa `if (!this.visible) return` così è idempotente. |
| **Box unica con avatar laterale e risposte sotto il testo** | Ispirata ai classici RPG (Baldur's Gate): l'interfaccia non si frammenta in schede galleggianti ma concentra ritratto, battuta e risposte in un unico pannello espandibile verso l'alto con divisore dorato e doppio bordo in stile sala prove. |
| **Blocco del movimento solo durante conversazioni NPC (`uiState.dialogueLocked`)** | Durante un dialogo a bivi il giocatore deve restare focalizzato e non allontanarsi per sbaglio, mentre durante le ispezioni degli arredi e la descrizione stanza l'esplorazione deve rimanere fluida (con chiusura a distanza di 120 px). |
| **Riga di uscita "Esci" + ESC con `queueMicrotask`** | Consente al giocatore di interrompere la conversazione a qualsiasi bivio. Chiudere il dialogo in un microtask garantisce che il click/tap di chiusura non venga propagato alla scena come click di movimento sul pavimento (trabocchetto 24). |
| **Avatar generati a runtime (`createAvatarTextures`)** | Generazione procedurale di texture quadrate (`avatar-<id>`) con iniziale e colore camicia dai dati JSON esistenti, più `avatar-generic`: zero asset statici necessari e coerenza immediata con tutti i personaggi presenti nel registro. |
| **`speakerId` nei payload dei dialoghi** | Permette al `DialogueBox` di identificare la texture dell'avatar sia per gli interlocutori NPC sia per il giocatore quando parla dopo aver scelto un'opzione. Per gli arredi `speakerId` è omesso e l'avatar non viene mostrato. |

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

17. **`fillStyle` con un colore in stringa non dà errore: dà una cella vuota.** I colori dei JSON
    sono `#rrggbb`; passati diretti a `fillStyle`/`lineStyle` diventano una tinta `NaN` e **non viene
    disegnato niente**, senza eccezioni e senza errori in console. Il sintomo è subdolo: texture
    creata, animazioni create, personaggio "presente" ma invisibile, e `getSourceImage()` che
    restituisce una canvas vuota. Convertire sempre con `Phaser.Display.Color.HexStringToColor(c).color`
    (`tint()` in `src/gfx/characterArt.js`).

18. **`Container` non ha `setOrigin`.** Le schede della scelta personaggio sono dentro un `Container`
    centrato con `setPosition` e figli posizionati a mano: chiamare `container.setOrigin(0.5, 0.5)`
    fallisce a runtime. L'origin si imposta sui figli.

19. **Per leggere i pixel di una texture generata, `getSourceImage()` non va bene in WebGL.** Se la
    texture è stata creata da `textures.createCanvas` il `getSourceImage()` **è** la
    `HTMLCanvasElement` e si legge con `getContext('2d')`; se è passata da `generateTexture` con
    accelerazione, non c'è una `getCanvas()` e il controllo restituisce "zero pixel" **perché non ha
    guardato niente**. Il metodo affidabile per una verifica pixel è: disegnare il personaggio in un
    `Graphics` con `add: false`, chiamare `generateTexture('probe', ...)` e leggere la canvas
    risultante. Nello stesso file, `getSourceImage().getCanvas?.()` restituendo `undefined` è la
    spia che il controllo è vuoto, non che il disegno lo sia.

20. **`renderer.snapshotPixel(x, y, cb)` può non chiamare mai la callback.** La richiesta viene
    schedulata per il frame successivo: se lo script di verifica non aspetta (o chiude il browser
    prima), non arriva nulla e il timeout sembra un bug del gioco. Per misurare il rendering conviene
    lo screenshot a pagina intera (trabocchetto 12) oppure il bake di una texture di prova
    (trabocchetto 19).

21. **`save()`/`translateCanvas()`/`scaleCanvas()`/`restore()` funzionano anche dentro
    `generateTexture`.** Il dubbio naturale è che il percorso canvas (`renderCanvas`) e quello WebGL
    trattino le trasformazioni in modo diverso e che la corporatura si perda: non è così, e
    `g.scaleCanvas(build.width, build.height)` con `translateCanvas` attorno al punto dei piedi scala
    il personaggio attorno a sé, come voluto, nelle due pipeline.

22. **`Phaser.Input.Keyboard.JustDown(key)` richiede `key.isDown === true` nel frame di `update()`.**
    Se un tasto viene premuto e rilasciato velocemente (o inviato via script di test) prima del
    tick del render loop, `JustDown` restituisce `false` e il tocco va perso. Per comandi discreti
    (navigazione a schede, conferma con INVIO, interazioni con tasti specifici) usare sempre
    `this.input.keyboard.on('keydown-KEY', ...)` che risponde immediatamente all'evento DOM.

23. **L'`pointerdown` di un oggetto interattivo parte PRIMA di quello della scena.**
    `InputPlugin` processa prima gli hit test per oggetto (dall'alto in basso nella lista di
    visualizzazione), poi gli handler di scena: un tap che sceglie un'opzione di dialogo fa partire
    `pickOption()` e subito dopo l'`advance()` di `HudScene`, che avanzerebbe la prima battuta del
    nodo appena aperto (la riga del giocatore salterebbe). La difesa è un flag `suppressAdvance`
    imposto nel `pointerdown` dell'oggetto e azzerato da un `queueMicrotask`: la scena controlla il
    flag nello stesso ciclo sincrono dell'input, il microtask ripulisce appena finito.

24. **`close()` immediato su pointerdown di un pulsante UI può far scattare il click di scena sul pavimento.**
    Se il click su una riga UI chiude il dialogo istantaneamente nello stesso stack di esecuzione, le scene
    sottostanti vedono `uiState.dialogueOpen = false` prima di terminare la propagazione dell'evento e interpretano
    il tap come comando di movimento sul pavimento. Rimandare la chiusura effettiva con `queueMicrotask(() => this.close())`
    mantiene il dialogo formalmente aperto fino alla conclusione del ciclo di input.

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

### 2026-10-05 — Sessione 6: personaggi dai JSON e schermata di scelta

Fatto:

- **`drawCharacterCell` generico** (`src/gfx/characterArt.js`): firma
  `(g, cx, feetY, look, facing, phase)`, corpo modulare, capelli (`short`, `long`, `bun`,
  `ponytail`, `curly`, `bald`), outfit (`tee`, `hoodie`, `jacket`, `dress`, `sleeveless`) e
  accessori (`glasses`, `beard`, `mustache`, `hat`, `headphones`, `scarf`, `strap`). Fuori da
  `textureFactory.js`, che ora contiene solo arredi e ombre.
- **Registro personaggi** (`src/game/characters.js`): importa i JSON di `src/data/characters/`,
  rifiuta id duplicati, normalizza i colori (`#rgb` e `#rrggbb`), completa i campi mancanti con
  avviso in console, blocca `build` fra 0.85 e 1.15, e espone le chiavi
  `character-<id>` / `character-<id>-{idle,walk}-<facing>`.
- **Dati**: quattro giocabili (`luca`, `mara`, `theo`, `nina`, segnaposto da sostituire) e due NPC
  (`basso`, `batterista`).
- **Celle 32 × 56** con i piedi a 3 px dal fondo, al posto delle vecchie 32 × 40: l'altezza extra
  serve a non tagliare i berretti e i capelli lunghi sul personaggio più alto.
- **Camminata con quattro pose**: le fasi sono `[0, +SWING, 0, -SWING]` e la clip usa i frame
  `1,2,3,2`, così il ciclo torna sulla posizione di passaggio invece di zoppicare.
- **`Player` generico**: texture, prefisso delle animazioni (`animPrefix`) e scala dell'ombra
  (`shadowScale`) arrivano dalla `look`; la camera e le collisioni non cambiano.
- **`CharacterSelectScene`**: schede con anteprima disegnata dagli stessi dati del gioco, 4 colonne
  in landscape e 2 in portrait, conferma col bottone o con `INVIO`/`SPAZIO`/`E`, scelta messa nel
  registry (`currentCharacterId`) e avvio di `RoomScene` + `HudScene`.
- **`?char=<id>`** salta la scelta (`src/core/urlParams.js`), utile per le prove e per gli smoke test.
- `BootScene` genera i fogli dei soli giocabili; gli NPC vengono generati quando servono.
- **NPC in stanza (`src/entities/Npc.js`)**: Il bassista e La batterista posizionati nella sala prove
  con etichetta nome e ruolo sopra la testa, animazione idle coerente con la direzione dello spawn,
  corpo solido integrato in collisioni e pathfinding `buildWalkableGrid`.
- **Dialoghi a più battute**: `InteractionSystem.js` supporta `describe()` restituente array di
  pagine, inviando più `DIALOGUE_SAY` in coda al `DialogueBox`.
- **Input tastiera su `CharacterSelectScene`**: gestione con listener di evento `keydown` (frecce,
  WASD, INVIO, SPAZIO, E) anziché polling `JustDown`, prevenendo eventi persi tra frame.

Due difetti trovati e corretti in questa sessione:

- **`fillStyle` con colori in stringa**: nessuna delle celle era disegnata, il personaggio era
  invisibile in gioco e non usciva nessun errore. Corretto con `tint()` in `characterArt.js`
  (trabocchetto 17).
- **Camminata a due pose**: `generateFrameNumbers(start+1, end+3)` dava tre frame di cui il primo e
  il terzo erano la stessa posizione neutra; il ciclo zoppicava. Ora i frame sono espliciti
  (`1,2,3,2`).
- **Vista laterale completa per sinistra e destra (`drawProfileCell`)**: prima le direzioni sinistra e
  destra riusavano lo stesso corpo frontale (gambe affiancate, busto largo 16 px, scarpe frontali),
  cambiando solo la posizione degli occhi. Ora `drawProfileCell` disegna il personaggio di profilo:
  busto stretto a 11 px, braccio e gamba posteriori dietro al corpo che oscillano all'indietro, braccio
  e gamba anteriori in primo piano con scarpe che puntano chiaramente nella direzione di camminata
  (`head.dir`), naso ed orecchio visibili, e accessori sagomati lateralmente. Le coordinate speculari
  garantiscono simmetria perfetta (0 pixel di differenza di forma in `art.mjs`).

Verifiche fatte:

- `check.mjs`: **16/16** — scena di selezione attiva, 4 texture e 32 animazioni, click sulla terza
  scheda e ingresso in stanza, texture/animazioni del personaggio scelto, animazione di camminata e
  movimento reale, `?char=nina`, layout portrait con le schede dentro lo schermo, nessun errore in
  console.
- `art.mjs`: **48/48** — bake delle celle e lettura dei pixel: nessun personaggio tagliato ai lati o
  in alto, piedi dentro la cella, tutti i colori del JSON presenti nel disegno, corporatura
  verificata con la stessa identità e `build` 0.85/1.00/1.15, sinistra e destra con la stessa forma,
  tre pose di camminata diverse, sei disegni tutti diversi.
- `test_npc.mjs`: **20/20** — scelta del personaggio da tastiera, spawn in stanza con texture
  corretta, presenza dei 2 NPC (`basso` e `batterista`) con sprite/ombra/etichetta nome/ruolo, corpo
  solido anticollisione, hint interattivo `[E] Parla con`, dialogo a due battute sequenziali con
  avanzamento `E`/tap, pathfinding che guida il giocatore fino alla batterista e apre il dialogo.
- `npm run lint` pulito, `npm run build` ok (37 moduli), `npm run build:single` ok.

### 2026-10-05 — Sessione 7: i 4 componenti dei Jackanal e posizionamento dinamico nella stanza

Fatto:

- **Caratterizzazione dei 4 protagonisti** (`src/data/characters/playable/`):
  - `riccardo`: Cantante, capelli corti marroni.
  - `concy`: Bassista, capelli biondi alle spalle, tracolla del basso.
  - `marco`: Chitarrista, capelli corti neri e barba corta.
  - `davide`: Batterista, barba marrone lunga e coppola in testa.
- **Outfit band coordinato**: tutti i 4 vestono t-shirt blu `#1172e3` con logo bianco Jackanal ricamato
  sul petto ad altezza cuore (da `public/logo-bianco.svg`), jeans scuri e scarpe scure.
- **Logo bianco sul petto**: disegnato sia in vista frontale che di profilo sul torso della t-shirt.
- **Barba lunga e coppola**: supporto per `effect.length: 'long'` (barba più folta e allungata) e
  `effect.style: 'coppola'` (sagoma piatta con visiera anteriore accentuata).
- **Posizionamento dinamico della band in stanza**:
  - `sala-prove.json` contiene la configurazione per tutti e 4 i musicisti (Davide alla batteria,
    Concy all'ampli basso, Marco all'ampli chitarra, Riccardo al centro della sala).
  - `RoomScene.js` assegna il personaggio scelto al giocatore e istanzia automaticamente **gli altri
    tre come NPC interattivi** nelle loro postazioni strumentali.
  - Ciascun compagno ha dialoghi personalizzati sul proprio strumento/ruolo.
- **Definizione della bocca sulle barbe (`EFFECT_DRAWERS.beard`)**: spacco labiale in tono pelle
  `look.skinShade` e linea della bocca `#8a3830`, chiaramente visibili anche su barbe nere come quella
  di Marco sia frontalmente che di profilo.
- **NPC che si girano verso il giocatore (`faceTowards` e `resetFacing`)**: quando il giocatore clicca,
  tocca o preme `E` su un NPC, questo si orienta immediatamente verso il personaggio giocante
  (`faceFromVector`). Quando il giocatore si allontana fuori dal raggio di interazione, l'NPC torna
  automaticamente al facing originale verso il proprio strumento.

Verifiche fatte:

- `test_band.mjs`: **24/24** (4 schede band in selezione, magliette blu `#1172e3`, ingresso con
  Riccardo e presenza dei 3 compagni NPC Concy/Marco/Davide, dialogo a 2 pagine con Marco, ingresso con
  Concy e presenza di Riccardo/Marco/Davide).
- `test_npc_facing.mjs`: **7/7** (rotazione NPC verso destra e verso il basso, ripristino facing
  all'allontanamento, 12 pixel di bocca visibile sopra la barba nera di Marco).
- `art.mjs`: **48/48** (0 px discrepanza di forma fra sinistra e destra).
- `check.mjs`: **16/16**.
- `npm run lint` pulito, `npm run build` ok (37 moduli), `npm run build:single` ok.

### 2026-10-05 — Sessione 8: chiusura dialogo per distanza

Fatto:

- **Dialogo che si chiude se il giocatore si allontana**: in `RoomScene.update()` si controlla la
  distanza tra `player` e `dialogueTarget` (l'NPC/arredo con cui si sta parlando). Se supera
  `dialogueMaxDistance = 120` px, viene emesso `DIALOGUE_CLOSED` che chiude il riquadro e ripulisce
  lo stato.
- Il `dialogueTarget` viene tracciato sia quando il dialogo parte col click/tap (`resolvePending()`)
  sia con la tastiera (`requestInteract()`).
- Subscription a `DIALOGUE_CLOSED` per azzerare `dialogueTarget` quando il dialogo finisce
  normalmente; cleanup in `destroy()`.

Verifiche fatte:

- `npm run lint` pulito.
- `npm run build` ok (37 moduli).
- `npm run build:single` ok.

### 2026-10-06 — Sessione 9: dialoghi a rami, una battuta per chi ascolta

Fatto:

- **Grafo per parlante**: `src/data/dialogues/<id>.json` (riccardo, concy, marco, davide). Ogni
  file ha `entries` (nodo d'ingresso per ascoltatore + `default`) e `nodes`: `lines` (stringa =
  parla il parlante, `{speaker, text}` = parla un altro) e `options` (1–3 risposte con `next`).
  Ogni NPC saluta e reagisce diversamente a seconda di chi sta giocando.
- **Registro `src/game/dialogue.js`**: importa i JSON in `DIALOGUES`, valida all'avvio con
  warn-once `[dialogue]` (ascoltatori non giocabili, `next` inesistenti, nodi vuoti, oltre
  `MAX_OPTIONS = 3`), risolve ingresso e nodo con fallback:
  `entries[listener] → entries.default → character.lines → tagline`. I JSON dei personaggi non
  sono stati toccati.
- **Runner `src/systems/dialogueRunner.js`**: macchina a stati (`start`/`choose`/`stop`) sul bus.
  tiene il nodo corrente, emette `DIALOGUE_NODE` con battute e opzioni, e alla scelta prepone la
  battuta del giocatore (`{speaker: name, text: option.text}`) a quelle del nodo successivo. Gli
  arredi passano dallo stesso runner ma con `DIALOGUE_SAY` a pagine, come prima.
- **Risposte nel `DialogueBox`**: `renderOptions()` disegna le righe sopra il riquadro (badge
  "1. ", wordWrap, rettangolo interattivo con cursore a mano) e i tasti `1`–`3` fanno lo stesso.
  `suppressAdvance` + `queueMicrotask` impedisce che lo stesso tap che sceglie avanzi anche la
  prima battuta nuova (trabocchetto 23). `uiState.dialogueOptionsOpen` blocca l'avanzamento da
  tap sul canvas finché le opzioni sono aperte (`HudScene`).
- **`DIALOGUE_CLOSED` sul bus globale**: `close()` ora emette sul bus e torna subito se già
  chiuso: prima l'evento finiva solo su `scene.events` dell'HUD e `RoomScene` non vedeva la fine
  naturale del dialogo.
- Rimossi `InteractionSystem.trigger()` e `Npc.describe()`: superati dal runner.
- README aggiornato (controlli con tap su risposta e tasti `1`–`3`, sezione "Formato dei
  dialoghi", albero del progetto, "Un nuovo dialogo"); qui sopra: 5 nuove righe di decisioni e il
  trabocchetto 23.

Verifiche fatte:

- `npm run lint` pulito.
- `npm run build` ok (43 moduli).
- Validazione statica dei 4 JSON: tutti i riferimenti `entries`/`next` risolti.
- Script Playwright funzionale (Chrome di sistema, script fuori repo): **46/46**, due esecuzioni
  consecutive. Copre la matrice 4 personaggi × 3 NPC con esplorazione di tutti i rami (ingresso
  personalizzato, eco della scelta in bocca al giocatore, chiusura pulita a ogni foglia), il
  percorso arredo con `DIALOGUE_SAY`, il tap reale su una riga-opzione (coordinate logiche →
  CSS, nessuna battuta saltata), il tap sul canvas per avanzare, la chiusura con `DIALOGUE_CLOSED`
  e zero warning `[dialogue]` in console.

### 2026-10-06 — Sessione 10: redesign UI dialogo, avatar laterale, uscita ESC e blocco movimento NPC

Fatto:

- **Blocco movimento durante dialogo NPC**: introdotto flag `uiState.dialogueLocked` impostato a `true`
  all'avvio di un dialogo con un NPC (`DialogueRunner.start(character)`) e azzerato a `false` alla chiusura
  (`stop()`). In `Player.update()`, se `dialogueLocked` è attivo il giocatore azzera la velocità, interrompe il
  cammino e resta in posa idle, ignorando qualsiasi input da tastiera. Le descrizioni degli arredi e della stanza
  lasciano il movimento sbloccato (con chiusura automatica se ci si allontana oltre 120 px).
- **Redesign UI `DialogueBox`**: unificazione in una singola box in basso con stile moderno, fondo scurito,
  doppio bordo rifinito con filetti dorati e luce superiore. Quando sono presenti scelte del giocatore, le opzioni
  vengono renderizzate all'interno della stessa box SOTTO il testo, separate da una linea divisoria dorata, con
  badge numerati 1–3 e rettangoli interattivi con effetto hover.
- **Avatar quadrato laterale**: avatar ritratto (stile Baldur's Gate) posizionato a sinistra del nome e della
  battuta (64×64 px landscape, 56×56 px portrait) racchiuso in una cornice dedicata. Visibile solo quando
  è presente uno `speakerId` associato.
- **Avatar procedurali a runtime (`createAvatarTextures`)**: in `BootScene`, vengono generate su canvas
  le texture `avatar-<id>` per tutti i giocabili e NPC (iniziale maiuscola e colore della camicia dai dati JSON),
  più `avatar-generic`.
- **`speakerId` nei payload**: `normalizeLines` assegna lo `speakerId` per ogni battuta dei dialoghi. Quando il
  giocatore sceglie una risposta, il `DialogueRunner` emette la battuta del giocatore con il suo `speakerId`,
  mostrando l'avatar del personaggio giocante per la sua battuta prima di passare alla replica dell'NPC.
- **Opzione di uscita esplicita (riga Esci + tasto ESC)**: sotto le opzioni compare sempre la riga "Esci dalla
  conversazione" con badge "ESC". Premere `ESC` o toccare la riga chiude il dialogo ed emette `DIALOGUE_CLOSED`.
  La chiusura effettiva è delegata a un `queueMicrotask` per evitare che il click venga interpretato dalla scena
  come spostamento sul pavimento.
- **README e KNOWLEDGE aggiornati**: documentati nuovi controlli, opzioni di uscita, specifiche dei dialoghi,
  tabella decisioni e nuovo trabocchetto 24.

Verifiche fatte:

- `npm run lint` pulito (0 errori).
- `npm run build` ok (43 moduli).
- `npm run build:single` ok (bundle single-file aggiornato).
- Test funzionale automatizzato con Playwright su Edge headless (10/10 test superati):
  1. Texture avatar generate a runtime per tutti i giocabili/NPC e generico.
  2. Movimento iniziale del giocatore verificato.
  3. Blocco movimento del giocatore con `uiState.dialogueLocked` durante conversazione NPC.
  4. Mostra avatar corretto per l'NPC interlocutore.
  5. Rendering opzioni numerate e riga di uscita dentro la box unificata.
  6. Chiusura del dialogo tramite tasto ESC e sblocco immediato del movimento.
  7. Chiusura del dialogo tramite tap/click sulla riga "Esci dalla conversazione".
  8. Selezione opzione con tasto numerico e turno del giocatore con avatar del giocabile.
  9. Descrizione arredo senza avatar e con movimento libero verificato.

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
- **Personaggio**: un JSON in `src/data/characters/`; `playable/` per chi si sceglie all'inizio,
  `npc/` per chi sta in stanza.
- **Look**: la `look` di un personaggio, cioè il JSON completato con i valori di default e le
  sfumature derivate (`skinShade`, `shirtLight`, ...): è ciò che `drawCharacterCell` disegna.
- **Foglio del personaggio**: texture 128 × 224 con 4 direzioni × 4 frame in celle 32 × 56, chiave
  `character-<id>`.
- **Profondità (`depth`)**: ordine di disegno. Pavimento −2000, muri −1000, arredi e personaggio il
  proprio `y`.