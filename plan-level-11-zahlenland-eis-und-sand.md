# Plan: Level 11 – Zahlenland (Eis & Sand)

## Idee

* **Der Spieler ist eine Zahl.** Start bei `1`. Jede Münze macht daraus `2`, `3`, `4` … bis maximal `10`.
* **Das Level** besteht aus Eis- und Sandflächen und führt über **Stufen nach oben**.
  Neues Hindernis: **Eiszapfen/Stacheln, die von oben herunterfallen.**
* **Die Gegner** (Minus-Monster) müssen **übersprungen** werden. Berührung → die Zahl
  schrumpft (aus einer `3` wird wieder eine `2`).
* **Das Ziel** ist ein großes **Gleichheitszeichen `=`**. Je höher die Zahl, desto mehr Punkte.
  Bei voller Punktzahl (`10`) gibt es eine **Spezial-Animation** und man wird **unbesiegbar**.

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `modules/level.js` | Level-11-Daten (Theme `numbers`, Stufen, Eiszapfen, Gegner, `=`-Ziel) |
| `modules/stickman.js` | `drawNumber()` – Spielfigur als Ziffer mit Armen/Beinen + Aura |
| `modules/ui.js` | Hintergrund `numbers`, `drawSpikes()`, `_drawEqualsGoal()`, `_drawMinusMonster()`, `drawNumberHUD()` |
| `modules/learn.js` | 3 neue Physik-Fakten |
| `modules/audio.js` | `_melodyNumbers()` + `playNumberUp/Down()` + `playPowerUp()` |
| `game.js` | Zahlen-State, Eiszapfen-Update, Schadens-Gegnermodus, Unbesiegbarkeit, Weltkarten-Knoten |
| `index.html` | Cache-Version `?v=19` |

## Level-Layout (worldWidth 2250, worldTop −420)

```
Sektion 1  Sandboden          x 0–300      y 370
Sektion 2  Eistreppe hoch     x 345–860    y 325 → 190   (4 Stufen, je +45 hoch, 45 Lücke)
Sektion 3  Sand-Plateau       x 860–1110   y 190          Gegner + 2 Eiszapfen
Sektion 4  Treppe 2           x 1155–1545  y 150 → 60     Eis/Sand im Wechsel, 3 Eiszapfen
Sektion 5  Sand-Plateau       x 1545–1765  y 60           Trampolin + 2 Gegner + 2 Eiszapfen
Sektion 6  Aufstieg zum Ziel  x 1810–2170  y 0 → −60      letzter Gegner, 1 Eiszapfen
Ziel       „=“                x 2020       y −100
```

Sprungreichweite: `JUMP_FORCE 9.5 / GRAVITY 0.5` → max. 90 px Höhe. Alle Stufen steigen
maximal 60 px bei 40–45 px Lücke → sicher schaffbar.

## Mechaniken

### 1. Zahlen-System (`numberMode: true`)

* `playerNumber` startet bei `1`, Münze → `+1` (Deckel bei 10), Treffer → `−1`.
* Fällt die Zahl unter 1 → `gameOver`.
* 12 Münzen im Level, aber Deckel bei 10 → zwei Treffer sind verzeihbar.
* Anzeige: Canvas-Badge oben mittig (`drawNumberHUD`).

### 2. Gegner-Modus `enemyMode: "damage"`

Bisher löst jede Gegner-Berührung automatisch einen Roundhouse-Kick aus. Für Level 11
schaltet `enemyMode` um:

* Berührung → `playerNumber--`, Rückstoß, 90 Frames Unverwundbarkeit (blinken).
* **Überspringen** (Spieler komplett über dem Gegner) → `+15` Bonus, einmal pro Gegner.
* **Unbesiegbar** (Zahl = 10) → alter Kick greift wieder, Gegner fliegen weg.

### 3. Fallende Eiszapfen (`spikes`)

Zustandsautomat pro Zapfen: `hang → fall → broken → hang`.

```js
{ x, y, floorY, cycle, phase }   // cycle/phase in Frames
```

* `hang`: wackelt, letzte 30 Frames blinkt er als Warnung (fair für Kinder).
* `fall`: `vy += 0.45`, Treffer am Spieler → gleicher Schaden wie Gegner.
* `broken`: Splitter-Animation, dann Reset nach oben.

### 4. Unbesiegbarkeit & Spezial-Animation

Beim Erreichen der `10`: `specialAnimTimer = 150` → expandierende Ringe, Funken,
Text „UNBESIEGBAR!“, Power-up-Fanfare. Danach dauerhafte Aura um die Ziffer,
Gegner werden weggekickt, Eiszapfen prallen ab.

### 5. Ziel & Wertung

* `=`-Zeichen: zwei dicke pulsierende Balken, darüber die erreichte Zahl.
* Bonus: `playerNumber × 50`; bei `10` zusätzlich `+500` und „PERFEKT 10/10“.

## Neue Lernfakten

| Fakt-ID | Titel | Icon |
|---|---|---|
| `num_ice_stairs` | Reibung auf Eisstufen | 🧊 |
| `num_freefall` | Freier Fall | 🧊 |
| `num_energy_count` | Energie sammeln | 🔢 |

## Musik

`numbers`-Theme: helle, hüpfende Dur-Pentatonik im Zähl-Rhythmus (Triangle, 0.16 s/Note) –
klingt wie ein Abzählreim, passend zu Eis (hell) und Sand (warm).

## Risiken / Randfälle

* **Level-Auswahl per Tastatur** kennt nur die Ziffern 1–9 (`parseInt(e.key)`), Level 10 und 11
  sind nur per Klick/Tap auf der Weltkarte erreichbar. Kein Regressionsrisiko, aber bekannt.
* Gegner auf schmalen Stufen wären unfair → Gegner stehen nur auf Plateaus und breiten Stufen.
* Eiszapfen mit langen Zyklen (170–200 Frames) + Warnblinken, damit Timing lernbar bleibt.
* `enemyMode`/`numberMode` sind opt-in pro Level → Level 1–10 bleiben unverändert.

## Verifikation

1. Level 11 über die Weltkarte starten (Klick auf Knoten 11).
2. Münzen sammeln → Ziffer wächst sichtbar von 1 aufwärts.
3. Gegner absichtlich berühren → Ziffer sinkt, Blinken, Rückstoß.
4. Bei 10 → Spezial-Animation, Gegner fliegen bei Berührung weg.
5. Eiszapfen abwarten → fallen, zerbrechen, kommen wieder.
6. Ziel `=` erreichen → Bonus abhängig von der Zahl.

---
*Erstellt: 2026-08-01*
