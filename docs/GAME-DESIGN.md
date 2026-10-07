# Game design

## Concept

Un RPG visto dall'alto in cui si gira per una casa piena di musica. Non un rpg con combattimento a
turni: un gioco di **presenza**. Ogni stanza è un posto reale (la sala prove, il soggiorno, il
corridoio), con i suoi arredi e la sua luce, e il personaggio ci passeggia dentro.

Il riferimento di stile è [Office Town](https://phaser.io/news/2026/09/office-town-phaser-coworking-game):
niente barre di statistiche, niente inventario sempre aperto. L'informazione arriva dal posto in cui
sei e da chi hai accanto.

## La stanza: Sala Prove

La prima stanza del gioco, e per ora l'unica.

- **Tono**: calda, vissuta, un po' polverosa. Legno ovunque, luce calda, attrezzatura vera.
- **Materiali**: parquet a listelli con nodi e venature, muri di legno con spessore visibile.
- **Contenuto**: batteria al centro in fondo, amplificatore per chitarra a sinistra, amplificatore
  per chitarra a destra, amplificatore per basso lungo la parete est, porta in fondo al corridoio.
- **Ingresso**: si parte davanti alla porta, guardando la batteria. Il primo dialogo dice cosa
  contiene la stanza.

Coordinate attuali nel JSON (tile da 32 px, stanza 30×20):

| Arredo | `x` | `y` | Note |
| --- | --- | --- | --- |
| Batteria | 15 | 6 | Ingombro 140×52, il punto focale della stanza |
| Amplificatore chitarra (sx) | 8 | 4.5 | Ingombro 52×34 |
| Amplificatore chitarra (dx) | 22 | 4.5 | Ingombro 52×34 |
| Amplificatore per basso | 26.5 | 6.8 | Ingombro 62×44, cassa più grande e scura, arretrata verso la batteria |
| Mixer audio | 4.5 | 9.5 | Ingombro 44×28, console a 16 canali su stativo, collegato alla presa |
| Presa elettrica | 1.6 | 9.5 | Presa a muro con spina inserita del mixer, non è un ostacolo |
| Cassa PA (sx) | 3.5 | 4.5 | Ingombro 32×24, diffusore attivo su stativo a treppiede |
| Cassa PA (dx) | 26.5 | 4.5 | Ingombro 32×24, diffusore attivo gemello su stativo a treppiede |
| Microfono per la voce | 13.0 | 11.0 | Ingombro 22×18, asta a giraffa davanti a Riccardo |
| Microfono cori | 9.5 | 7.2 | Ingombro 22×18, asta a giraffa davanti a Marco |
| Microfono cori (basso) | 24.0 | 8.5 | Ingombro 22×18, asta a giraffa davanti a Concy |
| Fascio di cavi e ciabatta | 4.5 | 12.5 | Cavi a terra con ciabatta multipresa, calpestabile |
| Matassa di cavi di scorta | 20.5 | 4.8 | Cavo arrotolato con fascetta, calpestabile |
| Porta | 15 | 20 | Nell'apertura del muro sud, non è un ostacolo |
| Spawn | 15 | 17 | Davanti alla porta, rivolto in alto |

## I personaggi

Il giocatore sceglie all'inizio **uno dei 4 componenti della band Jackanal**:
- **Riccardo**, il cantante: capelli corti marroni, frontman al centro della sala;
- **Concy**, la bassista: capelli biondi alle spalle, vicino all'amplificatore per basso;
- **Marco**, il chitarrista: capelli corti neri e barba corta, vicino all'ampli per chitarra;
- **Davide**, il batterista: barba marrone lunga e coppola in testa, vicino alla batteria.

Tutti indossano la t-shirt ufficiale blu (`#1172e3`) con il logo bianco Jackanal ricamato all'altezza
del cuore (da `public/logo-bianco.svg`), jeans scuri e scarpe scure.

Quando il giocatore seleziona uno di loro, **gli altri tre componenti della band compaiono nella stanza
come NPC interattivi**, posizionati vicino al proprio strumento o amplificatore. Ci si può avvicinare e
parlare con ciascuno per ascoltare le loro battute.

## Come si gioca

Un solo gesto: **dove punti, il personaggio va**. Mouse e dito sono equivalenti, non ci sono
joystick né pulsanti da schivare.

| | Tastiera e mouse | Touch |
| --- | --- | --- |
| Scegliere il personaggio | Click sulla scheda, frecce o `WASD`, poi bottone o `INVIO` / `SPAZIO` / `E` | Tap sulla scheda, poi sul bottone |
| Muoversi | Tasto premuto e trascinamento, oppure `WASD` / frecce | Dito premuto e trascinamento |
| Correre | `SHIFT` durante il cammino | — |
| Esaminare | Click sull'arredo, oppure `E` / `INVIO` / `SPAZIO` | Tap sull'arredo |
| Leggere | Click o `E` | Tap sul testo |

Regole che tengono il gioco semplice:

- Tenere premuto serve solo a **guidare**: il personaggio segue il puntatore e, per tutto il
  trascinamento, non può esaminare nulla. Le interazioni non partono mai mentre il dito è giù.
- Il tap su un arredo non è un comando a sé: il personaggio **ci va** e lo esamina quando è a
  portata. Niente dialoghi a distanza.
- Un tap vale solo se il puntatore non si è mosso più di dodici pixel: altrimenti è un
  trascinamento e viene ignorato come comando.
- Il tap sul muro porta il personaggio davanti al muro, non incastrato contro.
- Un tasto premuto durante una camminata annulla la destinazione: la tastiera vince sempre.
- Con un dialogo aperto il tocco avanza il testo e non muove il personaggio.
- Titolo e descrizione di un arredo appaiono **nello stesso momento**: niente effetto macchina da
  scrivere, così si legge tutto con un colpo d'occhio.

Su smartphone la visualizzazione si adatta automaticamente all'orientamento del dispositivo:
in orizzontale la risoluzione è 960 × 540 con telecamera a zoom 1.0 (stanza intera in larghezza);
in verticale passa a 540 × 960 con zoom 1.5 (stanza intera in altezza, telecamera che segue il
personaggio in orizzontale e dialoghi adattati). Tutto il canvas resta attivo senza controlli separati.

## Cosa NON c'è (di proposito)

Nessun combattimento, nessun nemico, nessun oggetto raccolto, nessuna missione, nessun
salvataggio su disco. Il brief chiedeva una stanza viva e un impianto pulito: aggiungere complessità
senza una direzione chiara è il modo più rapido di appesantire il gioco.

## Roadmap

Ordine consigliato. Ogni passo è piccolo e indipendente dagli altri.

1. **I quattro personaggi definitivi** — sostituire i JSON segnaposto con nomi, corporature e look
   veri. Nessuna modifica al codice: è un lavoro di dati, e per farlo servono le descrizioni.
2. **Personaggio con diritti** — sostituire il foglio generato con PNG veri, in 4 direzioni,
   e aggiungere varianti colore pelle/capelli. Le chiavi esistono già: `character-<id>`.
3. **Salire e sedersi** — interazione vera: `E` davanti alla batteria o agli ampli, il personaggio
   ci sale e ci resta. È il primo test serio per il depth sorting con gli arredi.
4. **Suonare** — un semplice sistema di minigame/ritmo, o audio statico + animazione, che lega
   l'interazione a un risultato.
5. **Più stanze e corridoi** — il JSON è già pronto; serve un meccanismo di passaggio fra stanze
   (`changeRoom` esiste) e una zona di triggers.
6. **Altre interazioni NPC e dialoghi ramificati** — scelte di risposta o reazioni in base allo
   strumento esaminato.
7. **Luce e ora del giorno** — un overlay di colore sulla stanza, ora diurna e notturna.
8. **Salvataggio** — `localStorage` con personaggio scelto, posizione, stanza e stato degli arredi.
9. **Audio** — chitarra, basso e batteria come loop, con volume regolabile.

## Principi di design da mantenere

- **La stanza dice cosa fare.** L'hint contestuale e le descrizioni contano più di un tutorial.
- **Meno HUD possibile.** Se un'informazione può stare nel mondo, nel mondo resta.
- **Ogni nuovo sistema deve stare in una `RoomScene` che si può ricostruire da un JSON.** Se serve
  un editor di layout, che sia un form dentro il JSON, non codice.
- **Il placeholder grafico si sostituisce, non si riscrive.** Le chiavi texture esistono già per
  accogliere i PNG.
- **L'aspetto è dato, non codice.** Un personaggio si cambia scrivendo un JSON: se per cambiare
  l'aspetto serve toccare `characterArt.js`, il vocabolario dei look è troppo chiuso.