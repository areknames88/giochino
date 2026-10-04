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
| Amplificatore per basso | 26.5 | 11 | Ingombro 62×44, cassa più grande e scura |
| Porta | 15 | 20 | Nell'apertura del muro sud, non è un ostacolo |
| Spawn | 15 | 17 | Davanti alla porta, rivolto in alto |

## Come si gioca

Un solo gesto: **dove punti, il personaggio va**. Mouse e dito sono equivalenti, non ci sono
joystick né pulsanti da schivare.

| | Tastiera e mouse | Touch |
| --- | --- | --- |
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

Nessun dialogo fra personaggi, nessun nemico, nessun oggetto raccolto, nessuna missione, nessun
salvataggio. Il brief chiedeva una stanza e un impianto: aggiungere roba senza sapere dove si
vuole andare è il modo più veloce di buttare via un boilerplate.

## Roadmap

Ordine consigliato. Ogni passo è piccolo e indipendente dagli altri.

1. **Personaggio con diritti** — sostituire il foglio generato con PNG veri, in 4 direzioni,
   e aggiungere varianti colore pelle/capelli.
2. **Salire e sedersi** — interazione vera: `E` davanti alla batteria o agli ampli, il personaggio
   ci sale e ci resta. È il primo test serio per il depth sorting con gli arredi.
3. **Suonare** — un semplice sistema di minigame/ritmo, o audio statico + animazione, che lega
   l'interazione a un risultato.
4. **Più stanze e corridoi** — il JSON è già pronto; serve un meccanismo di passaggio fra stanze
   (`changeRoom` esiste) e una zona di triggers.
5. **Dialoghi fra personaggi** — un NPC fermo con nome, ruolo e due righe di testo.
6. **Luce e ora del giorno** — un overlay di colore sulla stanza, ora diurna e notturna.
7. **Salvataggio** — `localStorage` con posizione, stanza e stato degli arredi.
8. **Audio** — chitarra, basso e batteria come loop, con volume regolabile.

## Principi di design da mantenere

- **La stanza dice cosa fare.** L'hint contestuale e le descrizioni contano più di un tutorial.
- **Meno HUD possibile.** Se un'informazione può stare nel mondo, nel mondo resta.
- **Ogni nuovo sistema deve stare in una `RoomScene` che si può ricostruire da un JSON.** Se serve
  un editor di layout, che sia un form dentro il JSON, non codice.
- **Il placeholder grafico si sostituisce, non si riscrive.** Le chiavi texture esistono già per
  accogliere i PNG.