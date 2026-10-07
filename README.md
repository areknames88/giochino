# Giochino Jackanal

Boilerplate per un gioco **RPG visto dall'alto** in **Phaser 3 + JavaScript**, pensato per essere
pubblicato come sito statico su **GitHub Pages**.

La reference di stile è [Office Town](https://phaser.io/news/2026/09/office-town-phaser-coworking-game):
stanza reale, arredi leggibili, personaggio che ci si muove dentro, niente HUD invasivo.

> Il nome del progetto è un placeholder preso dal nome della cartella: cambiarlo è una questione di
> `GAME.title` in `src/config.js` e del `<title>` in `index.html`.

## Stato attuale

Una sola stanza, la **Sala Prove**: parquet e muri in legno, una batteria, tre amplificatori (due chitarra,
uno basso), una chitarra elettrica rossa su stand, un basso Fender Precision sunburst su stand, un banco mixer collegato alla presa elettrica, due casse PA su stativo,
aste microfoniche per voce e cori, cavi che attraversano il parquet, fascio di cavi e ciabatta multipresa,
più la porta. Il personaggio si muove, la camera lo segue, gli arredi ostacolano e si possono ispezionare.

Prima di entrare nella stanza c'è una **schermata di scelta del personaggio**: quattro schede, una
per personaggio, disegnate a runtime dagli stessi dati che userà il gioco. Ogni personaggio è un
JSON in `src/data/characters/`, quindi aspetto, corporatura, capelli, outfit e accessori si cambiano
senza toccare il codice.

Non c'è ancora nessuna meccanica di gioco: l'interazione è **sola lettura** (descrizioni testuali),
come da specifica di partenza. I quattro compagni presenti nella stanza parlano però con dialoghi
a rami: cosa si dicono dipende da chi stai giocando, e ogni scelta del giocatore è una risposta
fra due o tre proposte.

## Requisiti

- Node.js 20 o superiore
- npm 10 o superiore

## Comandi

```bash
npm install       # installa le dipendenze
npm run dev       # server di sviluppo con HMR su http://localhost:5173
npm run build     # genera il sito statico in dist/ (per GitHub Pages)
npm run preview   # serve dist/ su http://localhost:4173
npm run build:single  # genera docs/dist-single/index.html, apribile con doppio clic
npm run editor        # avvia il CMS visivo per stanze, oggetti e dialoghi (http://localhost:3333)
npm run lint          # ESLint
```

### Aprire la build: `dist/` oppure `docs/dist-single/`?

`dist/index.html` **non** si apre con un doppio clic. Su `file://` i browser bloccano gli script
modulo ES (CORS), quindi la pagina resta su "caricamento". Per guardare la build normale:

```bash
npm run preview     # poi apri http://localhost:4173
```

Se invece serve un file che si apre direttamente dal disco (per provarlo, mandarlo a qualcuno,
metterlo in una cartella), usa:

```bash
npm run build:single
```

`docs/dist-single/index.html` è un file unico da ~1,2 MB con dentro tutto il gioco: si apre con
doppio clic, su qualsiasi sistema, senza server. Per GitHub Pages va benissimo anche questo, ma
la build normale è più comoda da servire perché separa codice e HTML.

Entrambe le build hanno `base: './'`, quindi funzionano sia come `username.github.io` sia come
`username.github.io/repo`.

## Controlli

Il gioco si gioca con un dito o con il mouse: **dove punti, il personaggio va**. Non ci sono
joystick né pulsanti da premere.

Tieni premuto e trascina: il personaggio continua a camminare seguendo il dito o il mouse, e
non succede nient'altro. Per esaminare un arredo serve un tocco secco.

| Gesto | Azione |
| --- | --- |
| Click o tap sul pavimento | Il personaggio cammina fino a quel punto, aggirando gli arredi |
| Click o tap su un arredo | Il personaggio gli va vicino e lo esamina |
| Tenere premuto e trascinare | Il personaggio segue il puntatore; nessuna interazione parte |
| Tap durante un dialogo | Avanza il testo |
| Tap su una risposta | Sceglie la risposta proposta (da una a tre) |
| Tap su "Esci dalla conversazione" | Chiude il dialogo durante le risposte |

### Tastiera

| Tasto | Azione |
| --- | --- |
| `WASD` / frecce | Movimento (annulla una destinazione impostata col mouse o col tocco) |
| `SHIFT` | Correre |
| `E` / `INVIO` / `SPAZIO` | Interagisci con l'arredo più vicino (e avanza i dialoghi) |
| `1` – `3` | Sceglie la risposta numerata durante un dialogo |
| `ESC` | Chiude la conversazione durante le risposte |
| `G` | Griglia delle tile e corpi di collisione |

### Smartphone e tablet

Il gioco supporta nativamente sia la modalità **orizzontale (landscape)** sia **verticale (portrait)**:

- in **landscape**: risoluzione 960 × 540, zoom 1.0, stanza visibile per intero in larghezza e telecamera che segue in verticale;
- in **portrait**: risoluzione 540 × 960, zoom 1.5, stanza visibile per intero in altezza e telecamera che scorre orizzontalmente al movimento del personaggio; il riquadro di dialogo e l'interfaccia si adattano alla larghezza dello schermo.

Ogni punto del canvas è attivo: basta toccare la metà destra, il basso o l'alto, non serve
mirare una zona particolare. Il tap sugli arredi funziona come sul desktop: non esiste un bottone
`E` da premere.

La legenda in basso a destra cambia da sola se il puntatore principale è un dito. Per provarla su
un computer, apri il gioco con `?touch=1` in fondo all'indirizzo
(esempio: `http://localhost:5173/?touch=1`): su un telefono il parametro non serve.

### Parametri dell'indirizzo

| Parametro | Effetto |
| --- | --- |
| `?char=<id>` | Salta la schermata di scelta e parte con quel personaggio (`riccardo`, `concy`, `marco`, `davide`) |
| `?touch=1` | Forza la legenda da dito anche su un computer |

La scelta vale per la sessione corrente: non viene salvata nel browser.

## Struttura del progetto

```
.
├── .github/workflows/pages.yml   # deploy automatico su GitHub Pages
├── index.html                    # shell della pagina, overlay di caricamento
├── vite.config.js                # build statico con base './' + build single-file
├── public/                       # file copiati alla root dell'output (.nojekyll, favicon)
├── dist/                         # output di npm run build   (non versionato)
├── docs/
│   ├── dist-single/              # output di npm run build:single (index.html)
│   ├── KNOWLEDGE.md              # log delle sessioni, decisioni, trabocchetti Phaser
│   └── GAME-DESIGN.md            # concept, specifica della stanza, idee per il futuro
└── src/
    ├── main.js                   # configurazione di Phaser e avvio delle scene
    ├── config.js                 # dimensioni, controlli, velocità, font
    ├── core/
    │   ├── eventBus.js           # bus di eventi condiviso fra le scene
    │   ├── input.js              # costruzione dei tasti + riconoscimento del touch
    │   └── uiState.js            # stato della UI letto dal gameplay
    ├── data/rooms/               # una stanza = un JSON
    │   └── sala-prove.json
    ├── data/characters/          # un personaggio = un JSON
    │   ├── playable/             # scelti nella schermata iniziale
    │   └── npc/                  # personaggi della stanza, non giocabili
    ├── data/dialogues/           # un parlante = un grafo di dialogo JSON
    │   └── riccardo.json
    ├── game/
    │   ├── rooms.js              # registro delle stanze
    │   ├── roomLayout.js         # da JSON a griglia di cellule solide + corpi di collisione
    │   ├── navigation.js         # griglia camminabile e percorso (A*) per il click
    │   ├── collision.js          # corpi statici + costanti di profondità (DEPTHS)
    │   ├── propTypes.js          # texture e ingombro per tipo di arredo
    │   ├── characters.js         # registro personaggi: JSON, validazione, chiavi texture/animazioni
    │   └── dialogue.js           # registro dialoghi: ingressi per ascoltatore, nodi, validazione all'avvio
    ├── gfx/
    │   ├── textureFactory.js     # texture generate a runtime (arredi, ombre)
    │   ├── characterArt.js       # disegno del personaggio: corpo, capelli, outfit, accessori
    │   ├── roomTextures.js       # parquet e muri disegnati su canvas
    │   └── rng.js                # rumore deterministico, utilità colore
    ├── entities/
    │   ├── Player.js             # sprite fisico: tastiera, destinazione e animazioni
    │   ├── Prop.js               # arredo: ombra + sprite + corpo statico
    │   └── Npc.js                # personaggio non giocante: ombra, sprite idle, etichetta nome e dialogo
    ├── systems/
    │   ├── interaction.js        # arredo più vicino, hit test col dito e "esamina"
    │   └── dialogueRunner.js     # macchina a stati del dialogo: nodo corrente, scelte, chiusura
    ├── ui/
    │   └── DialogueBox.js        # riquadro dialoghi: box unica, avatar quadrato, risposte sotto il testo, ESC
    └── scenes/
        ├── BootScene.js          # genera le texture e lancia la scelta del personaggio
        ├── CharacterSelectScene.js  # schede dei giocabili, conferma e avvio della stanza
        ├── RoomScene.js          # costruisce la stanza da JSON, camera, input, update
        └── HudScene.js           # HUD, hint contestuale, dialoghi
```

## Come funziona

1. **BootScene** genera tutte le texture a runtime (nessun file PNG nel repo): arredi, ombre e i
   fogli dei quattro personaggi giocabili, poi lancia `CharacterSelectScene`.
2. **CharacterSelectScene** mostra una scheda per ogni giocabile, con l'anteprima disegnata con gli
   stessi dati del gioco. Si sceglie col dito, col mouse o con frecce e `WASD`, si conferma col
   bottone o con `INVIO` / `SPAZIO` / `E`. La scelta finisce nel registry
   (`currentCharacterId`) e parte `RoomScene` + `HudScene`.
3. **RoomScene** legge il JSON della stanza, disegna parquet e muri su canvas, ricava la griglia
   delle celle solide e ne crea i corpi statici, poi posiziona arredi, NPC definiti nella stanza e il personaggio.
4. Gli NPC (`src/entities/Npc.js`) hanno ombra, sprite idle, etichetta nome e ruolo sopra la testa,
   sono corpi solidi considerati da collisioni e pathfinding, e parlano con dialoghi a rami
   accessibili con `E` o tap diretto. Quale battuta parte dipende da chi sta giocando:
   `src/game/dialogue.js` risolve il nodo d'ingresso in base all'ascoltatore, e ogni nodo può
   proporre da una a tre risposte. Sceglierne una prepone la battuta del giocatore al nodo
   successivo (`src/systems/dialogueRunner.js`).
5. La camera segue il personaggio e si ferma ai bordi della stanza.
6. L'ordinamento in profondità è **per Y**: ogni arredo, NPC e il personaggio hanno `depth = y`, quindi
   chi è più in basso nel disegno viene disegnato sopra. Pavimento e muri stanno dietro a tutto.
7. Un click o un tap viene tradotto in un punto del mondo con
   `cameras.main.getWorldPoint(...)`. Se il punto cade sull'ingombro di un arredo o di un NPC, diventa
   il bersaglio; altrimenti è il pavimento.
8. `RoomScene` calcola il percorso con `navigation.js`: una griglia di celle camminabili (muri fuori,
   ingombri degli arredi e degli NPC gonfiati del raggio del personaggio) e una ricerca A* che produce una
   sequenza di waypoint. Il tap su un muro porta il personaggio davanti al muro invece di farlo
   restare incastrato.
9. `Player` segue i waypoint; `RoomScene.resolvePending()` apre il dialogo quando il personaggio
   entra nella portata dell'elemento bersaglio, o appena arriva sul posto.
10. **HudScene** ascolta il bus di eventi e mostra nome stanza, coordinate, hint contestuale e
    dialoghi. Non conosce il gameplay, e il gameplay non conosce l'HUD.
11. La tastiera ha la precedenza: se premi un tasto durante una camminata, la destinazione viene
    annullata.

## Formato della stanza (JSON)

Ogni stanza è un file in `src/data/rooms/`. Non serve toccare il codice per cambiare arredi.

| Campo | Tipo | Descrizione |
| --- | --- | --- |
| `id` | stringa | Identificativo univoco, usato anche nei nomi delle texture |
| `name` | stringa | Nome mostrato nella targa in alto a sinistra |
| `tagline` | stringa | Frase sotto il nome |
| `description` | stringa | Testo mostrato dal riquadro dialoghi all'ingresso |
| `tileSize` | numero | Dimensione della tile in pixel (32) |
| `columns` / `rows` | numero | Dimensione della stanza in tile (30 × 20 = 960 × 640 px) |
| `seed` | numero | Seme del rumore: same stanza, stesso parquet, sempre |
| `palette.floor` | colori | `base`, `light`, `dark`, `seam` del parquet |
| `palette.wall` | colori | `top`, `light`, `face`, `dark`, `seam` dei muri |
| `walls` | array di rect | Rettangoli di celle solide, in coordinate tile (`x`, `y`, `w`, `h`) |
| `openings` | array di rect | Buchi nei muri (porte, finestre): vengono sottratti ai muri |
| `spawn` | oggetto | `x`, `y` in tile e `facing` (`up`/`down`/`left`/`right`) |
| `props` | array | Gli arredi (vedi sotto) |
| `cables` | array | Cavi disegnati sul parquet: percorsi di punti `[x, y]`, colore e spessore opzionali |

### Arredi (`props`)

```json
{
  "type": "amp",
  "variant": "guitar",
  "x": 8,
  "y": 4.5,
  "label": "Amplificatore chitarra (sx)",
  "prompt": "Esamina",
  "description": "Combo da 30 watt, telaio color panna, griglia in tessuto."
}
```

- `x` e `y` sono in **tile** e possono essere decimali. `y` è il punto in cui l'arredo tocca il
  pavimento: è anche il suo `depth`.
- `type` e `variant` determinano texture e ingombro (vedi `src/game/propTypes.js`).
- Tipi disponibili: `drum-kit`, `amp` (`guitar` / `bass`), `guitar` (`red`), `bass` (`precision`), `mixer`, `power-outlet`, `speaker` (`pa` / `monitor`), `mic-stand` (`boom`), `cables` (`bundle` / `coil`), `door`.
- Se l'arredo ha un ingombro, diventa automaticamente un ostacolo.
- `description` non vuota = arredo ispezionabile.

## Formato del personaggio (JSON)

Ogni personaggio è un file in `src/data/characters/playable/` (scelti all'inizio) oppure
`src/data/characters/npc/`. Un JSON nuovo basta per avere un personaggio nuovo: nessuna modifica al
codice.

```json
{
  "id": "theo",
  "kind": "playable",
  "name": "Theo",
  "tagline": "Alto, con le cuffie",
  "build": { "height": 1.08, "width": 1.06 },
  "palette": {
    "skin": "#c98f63",
    "hair": "#2b2018",
    "shirt": "#6b5aa0",
    "pants": "#2f3340",
    "shoes": "#20242c",
    "eye": "#1b1713"
  },
  "hair": { "style": "curly" },
  "outfit": { "style": "hoodie" },
  "effects": [
    { "type": "headphones", "color": "#33383f" },
    { "type": "beard", "color": "#3a2b20" }
  ]
}
```

| Campo | Tipo | Descrizione |
| --- | --- | --- |
| `id` | stringa | Identificativo univoco: entra nelle chiavi `character-<id>` e nel nome del file |
| `kind` | stringa | `playable` o `npc`: dice in quale cartella e dove viene usato |
| `name` | stringa | Nome sulla scheda della scelta iniziale |
| `tagline` | stringa | Frase sotto il nome sulla scheda |
| `build.height` / `build.width` | numero | Corporatura, fra 0.85 e 1.15 (taglia il disegno attorno ai piedi) |
| `palette.*` | colori | `skin`, `hair`, `shirt`, `pants`, `shoes`, `eye`, in `#rrggbb` |
| `hair.style` | stringa | `short`, `long`, `bun`, `ponytail`, `curly`, `bald` |
| `outfit.style` | stringa | `tee`, `hoodie`, `jacket`, `dress`, `sleeveless` |
| `effects` | array | Accessori, nell'ordine in cui vengono disegnati: `glasses`, `beard`, `mustache`, `hat`, `headphones`, `scarf`, `strap` |

- Tutti i campi si possono omettere: what's mancante prende un valore predefinito (`characters.js` lo
  avvisa una volta sola in console).
- I colori si possono scrivere come `#rgb` o `#rrggbb`. **`characters.js` li tiene come stringhe**:
  chi disegna deve convertirli con `Phaser.Display.Color.HexStringToColor` (vedi `tint()` in
  `characterArt.js`), perché `fillStyle` con una stringa produce una tinta `NaN` e la cella esce
  vuota.
- Con `outfit.style: "dress"` le gambe sono scoperte, quindi `palette.pants` non compare nel disegno.
- Il foglio di ogni personaggio è 4 direzioni × 4 frame in celle 32 × 56, con i piedi a 3 px dal
  bordo inferiore. Le chiavi sono `character-<id>`, `character-<id>-idle-<facing>` e
  `character-<id>-walk-<facing>`, con `facing` in `down`, `left`, `right`, `up`.
- I giocabili vengono generati tutti in `BootScene` (servono alle anteprime); gli NPC vengono
  generati solo quando qualcuno li usa.

## Formato dei dialoghi (JSON)

Un parlante ha un file in `src/data/dialogues/<id>.json` con il grafo delle sue battute. Il file
ha la precedenza: se manca, il dialogo cade sulle `lines` e `tagline` del JSON del personaggio
(ingresso di riserva, usato anche per gli arredi).

```json
{
  "id": "riccardo",
  "speaker": "riccardo",
  "entries": { "default": "saluto", "concy": "saluto-concy" },
  "nodes": {
    "saluto": {
      "lines": ["Oh, ciao. Stavo prendendo l'intonazione con la sala."],
      "options": [
        { "text": "Com'è andata la prova?", "next": "prova" },
        { "text": "La sala è tutta vostra?", "next": "sala" }
      ]
    },
    "prova": {
      "lines": ["La prova va da cannone."],
      "options": [{ "text": "E allora quando si riparte?", "next": "riparte" }]
    },
    "riparte": { "lines": ["Si riparte quando siamo tutti d'accordo."] }
  }
}
```

| Campo | Tipo | Descrizione |
| --- | --- | --- |
| `id` / `speaker` | stringa | Personaggio che parla; deve esistere in `characters.js` |
| `entries.default` | stringa | Nodo d'ingresso quando non c'è una voce specifica |
| `entries.<id>` | stringa | Nodo d'ingresso quando l'ascoltatore è `<id>` (uno dei quattro giocabili) |
| `nodes.<id>.lines` | array | Battute: stringa = le parla il personaggio, `{ "speaker": ..., "text": ... }` = le parla un altro |
| `nodes.<id>.options` | array | Da una a tre risposte: `text` è la frase che sceglie il giocatore, `next` il nodo dopo |

- La risposta scelta appare nel riquadro come battuta del giocatore, poi partono le `lines` del
  nodo `next`. Un nodo senza `options` chiude il dialogo.
- Al massimo 3 risposte (`MAX_OPTIONS`): il resto viene tagliato con un avviso in console.
- All'avvio `dialogue.js` valida tutto il registro: ascoltatori non giocabili, `next` che puntano a
  nodi inesistenti, nodi vuoti o risposte mancanti vengono segnalati una sola volta con il prefisso
  `[dialogue]`.

## Aggiungere cose

### Un nuovo tipo di arredo

1. Disegna la texture in `src/gfx/textureFactory.js` e generane la chiave `prop-<nome>`.
2. Registra chiave e ingombro in `src/game/propTypes.js`.
3. Usalo nel JSON della stanza.

### Una nuova stanza

1. Crea `src/data/rooms/<id>.json`.
2. Registrala in `src/game/rooms.js`.
3. Per cambiarla a runtime: `scene.get('Room').changeRoom('<id>')`.

### Un nuovo personaggio

1. Crea `src/data/characters/playable/<id>.json` (o nella cartella `npc/`).
2. Importalo e aggiungilo a `PLAYABLE_CHARACTERS` o `NPC_CHARACTERS` in `src/game/characters.js`:
   l'`id` deve essere unico, altrimenti il registro lo segnala subito.
3. Se il nuovo look usa uno stile di capelli, un outfit o un accessorio che non esistono ancora,
   aggiungi il disegno in `HAIR_DRAWERS`, `EFFECT_DRAWERS` o il blocco `outfit` di
   `src/gfx/characterArt.js`, e il nome nella lista di `characters.js` così i dati sbagliati
   vengono segnalati.

### Un nuovo dialogo

1. Crea `src/data/dialogues/<id>.json` con `entries` e `nodes` (vedi "Formato dei dialoghi").
2. Importalo nella lista `DIALOGUES` di `src/game/dialogue.js`: così viene validato all'avvio.
3. Nient'altro da toccare: runner e riquadro si consultano dal registro.

### La grafica vera

Le texture generate a runtime sono un traliccio: i nomi delle chiavi sono già quelli che
serviranno ai PNG reali. Sostituire una texture significa disegnarla in un file e caricarla con
`this.load.image(...)` invece di chiamare il relativo disegno in `textureFactory.js`: il resto del
codice non cambia.

## Pubblicare su GitHub Pages

Il repository è già predisposto: `vite.config.js` usa `base: './'`, `public/.nojekyll` impedisce a
Jekyll di ignorare i file che iniziano con `_`, e `.github/workflows/pages.yml` fa build + deploy.

1. Metti su GitHub e rendi `main` il branch di default.
2. In **Settings → Pages → Build and deployment**, scegli **Source: GitHub Actions**.
3. Fai push su `main`: il workflow pubblica `dist/` e ti dà l'URL.

Il sito funziona sia come `username.github.io` sia come project site `username.github.io/repo`,
perché tutti i percorsi sono relativi.

Nota: il workflow usa `npm ci`, quindi `package-lock.json` deve essere committato.

## Limiti noti

- L'interazione è solo descrittiva: nessuna meccanica (niente ancora, niente suonare).
- Il movimento è bloccato durante le conversazioni con gli NPC (il personaggio resta fermo
  fino alla conclusione o uscendo con ESC / riga "Esci"); per le descrizioni degli arredi il
  movimento resta libero e il riquadro si chiude automaticamente se ci si allontana oltre 120 px.
- Il percorso è calcolato sulla griglia delle tile: non attraversa gli angoli stretti, quindi
  qualche arredo contro muro resta irraggiungibile con un singolo tap (basta toccarlo due volte).
- Su telefono il gioco si adatta alla larghezza dello schermo mantenendo i 960 × 540 logici: in
  verticale resta letterboxed, è previsto per il gioco in orizzontale.
- Le texture sono placeholder: disegnate a runtime, non ancora ottime.
- La scelta del personaggio vale per la sessione: ricaricando la pagina si torna alla schelta iniziale.
- Nessun salvataggio, nessun audio, nessun multiplayer.
- Il bundle non è code-split: ~336 kB gzip, va bene per un gioco statico.

## Documentazione

- [`docs/KNOWLEDGE.md`](docs/KNOWLEDGE.md) — cosa è stato fatto, perché, e i trabocchetti di Phaser
  incontrati. **Da leggere prima di modificare qualsiasi cosa.**
- [`docs/GAME-DESIGN.md`](docs/GAME-DESIGN.md) — concept, specifica della stanza, roadmap.