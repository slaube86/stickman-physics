# Stickman Physics – Changelog

## Level 12: Steinzeit (2. August 2026)

Nach einer Zeichnung entstanden. Das Level ist kein Weg von links nach rechts, sondern
ein **Rundweg**: unten nach rechts, über den großen Bogen hinauf, **kopfüber** an der
Höhlendecke zurück nach links, und am Ende fällt man in die Burg.

### Neue Mechaniken
- **Klebeschuhe & Kopfüber-Laufen:** Wer die Kiste findet und am Bogenscheitel mit dem Kopf
  an die Decke stößt, bleibt dort kleben und läuft umgedreht weiter. Die Figur dreht sich
  weich um 180°, die Kamera schwenkt mit. Zurück geht es beim Verlassen des Deckenbereichs.
- **Bogenschießen** (`E` / 🏹-Knopf): Pfeile fliegen mit einem Sechstel der Schwerkraft,
  also im Bogen. Nachladezeit 25 Frames, unbegrenzt Pfeile.
- **Leitern** (`↑ ↓` / ▼-Knopf): An der Leiter pausiert die normale Physik. Der ▼-Knopf
  erscheint nur, solange man an einer Leiter steht.
- **Farbsteine** in Blau, Gelb und Rot färben das ganze Level um. Sie bleiben liegen,
  Punkte gibt es nur beim ersten Mal.
- **Treffer statt Tod** (`enemyMode: "hit"`): Gegner stoßen zurück und kosten einen Treffer
  in der Wertung, töten aber nicht.
- **Siegertreppchen:** Platz 1, 2 oder 3 je nach gesammelten Punkten und Treffern.

### Physik-Engine
- `resolveCollisions()` kennt jetzt `player.gravitySign`. Bei `-1` wird die **Unterseite**
  einer Plattform zum Boden. Für alle bestehenden Level ändert sich nichts – gegengerechnet
  bis auf die letzte Nachkommastelle.
- Neues Ereignis `head_hit`, über das die Klebeschuhe ausgelöst werden.
- Neue Untergründe `fels` (0.72) und `moos` (0.88).

### Inhalte
- **Gegner:** Höhlenviecher, fleischfressende Pflanze, Borstenvieh und zwei Höhlendrachen
  an der Decke. Die Drachen haben ein **Pfeilschild** – Pfeile prallen an ihren Schuppen ab.
- **Hindernisse:** fallende Stalaktiten, feststehende Steinzacken an der Decke.
- **Hintergrund:** Höhlenwand mit Höhlenmalerei im Parallax – Handabdrücke, Mammut, Hirsch,
  Jäger mit Speer, Spirale.
- **Vier Steinzeit-Fragen** zum Antippen: Feuer machen (Reibung), Höhlenmalerei, die Jagd
  aufs Mammut und warum der Pfeil im Bogen fliegt.
- **Musik:** Trommeln, Holzklopfen und eine karge Knochenflöte in Moll-Pentatonik.

### Getestet
Der Rundweg wurde mit der echten Physik-Engine simuliert: mit allen 20 geprüften
Sprung-Timings erreichbar, ohne Klebeschuhe sauber blockiert.

---

## Level 11: Zahlenland (1. August 2026)

### Neues Level
- **Theme:** `numbers`
- **Story:** Der Spieler *ist* eine Zahl – Start bei `1`, jede Münze macht daraus `2`, `3`, `4` … bis `10`
- **Level-Design:** Sandboden → Eistreppe nach oben → Sand-Plateau → zweite Treppe → Hoch-Plateau mit Trampolin → Aufstieg zum Gleichheitszeichen (vertikales Scrolling bis y = −420)

### Neue Mechaniken
- **Zahlen-Modus** (`numberMode`): Münze = `+1`, Gegnertreffer = `−1`, unter `1` → Game Over
- **Schadens-Gegner** (`enemyMode: "damage"`): Minus-Monster müssen übersprungen werden (`+15` Bonus), statt automatisch gekickt zu werden
- **Fallende Eiszapfen** (`spikes`): Zustandsautomat `hang → fall → broken`, mit Warnblinken vor dem Absturz
- **Unbesiegbarkeit ab Zahl 10:** Spezial-Animation (Ringe, Funken, Fanfare), Aura um die Ziffer, Gegner fliegen bei Berührung weg, Eiszapfen zerschellen
- **Ziel-Bonus:** `Zahl × 50`, bei `10` zusätzlich `+500`

### Neue Charaktere
- **Zahlen-Stickman** (`drawNumber()`): Die aktuelle Ziffer ist der Rumpf, dazu Kopf, Arme, Beine, Blinken nach Treffern und Funken-Aura
- **Minus-Monster** (`_drawMinusMonster()`): Zackiger Klumpen mit Minuszeichen als Mund
- **Gleichheitszeichen** (`_drawEqualsGoal()`): Zwei pulsierende Balken mit Strahlenkranz

### Neue Lernfakten
| Fakt-ID | Titel | Icon |
|---------|-------|------|
| `num_ice_stairs` | Eisstufen & Reibung | 🧊 |
| `num_freefall` | Freier Fall | ❄️ |
| `num_energy_count` | Sammeln & Zählen | 🔢 |

### Neue Musik & Sounds
| Name | Waveform | Stil |
|------|----------|------|
| `numbers` | Triangle | Hüpfender Abzählreim in C-Dur-Pentatonik (0.16 s/Note) |
| `playNumberUp()` | Triangle | Aufsteigendes Zwitschern, klingt mit jeder Stufe höher |
| `playNumberDown()` | Square | Absteigender Ton beim Treffer |
| `playPowerUp()` | Square + Sine | Fanfare mit Funkeln bei voller Punktzahl |

### Nebenbei behoben
- `render()` hatte ein `ctx.save()` ohne passendes `restore()` – der Canvas-State-Stack wuchs mit jedem Frame. Dadurch stand die Geschwindigkeitsanzeige in Levels mit vertikalem Scrolling auch an der falschen Stelle.

### Geänderte Dateien
- `modules/level.js` – Level 11 Daten inkl. `spikes`, `numberMode`, `enemyMode`
- `modules/stickman.js` – `drawNumber()`
- `modules/ui.js` – `numbers`-Hintergrund, `drawSpikes()`, `drawNumberHUD()`, `_drawEqualsGoal()`, `_drawMinusMonster()`
- `modules/learn.js` – 3 neue Fakten
- `modules/audio.js` – `_melodyNumbers()`, `playNumberUp/Down()`, `playPowerUp()`
- `game.js` – Zahlen-State, Eiszapfen-Update, Schadens-Modus, Spezial-Animation, Weltkarten-Knoten 11

---

## Level 5: Minecraft Welt (11. April 2026)

### Neues Level
- **Theme:** `minecraft`
- **Story:** Steve erkundet eine Minecraft-Landschaft und muss den Creeper finden
- **Level-Design:** Gras-Start → Blocktreppen (aufsteigend) → schwebende Plattform → Sand-Bereich → Lava-Lücke → Obsidian-Brücke → Eisbiom → Slime-Block (Trampolin) → Zielplattform

### Neue Charaktere
- **Steve** (Stickman-Ersatz in Level 5): Blockiger Pixel-Charakter mit kantigem Kopf, Kastenförmiger Körper, animierten Armen/Beinen, Pixel-Augen
- **Creeper** (Ziel-Ersatz in Level 5): Blockiges Minecraft-typisches Creeper-Gesicht (T-förmiger Mund, quadratische Augen), wippend

### Neue Lernfakten
| Fakt-ID | Titel | Icon |
|---------|-------|------|
| `mc_gravity` | Schwerkraft in Minecraft | ⛏️ |
| `mc_sand` | Sand & Schwerkraft | 🏜️ |
| `mc_slime` | Slime-Block & Elastizität | 🟩 |

### Neue Musik
| Theme | Waveform | Stil | Tempo |
|-------|----------|------|-------|
| `minecraft` | Triangle | Ruhige pentatonische C-Melodie (Exploration-Feeling) | 0.25s/Note |

### Geänderte Dateien
- `modules/level.js` – Level 5 Daten hinzugefügt
- `modules/stickman.js` – `drawSteve()` Methode
- `modules/ui.js` – `_drawCreeper()` + Theme-Weiche in `drawGoal()`
- `modules/learn.js` – 3 neue Minecraft Physik-Fakten
- `modules/audio.js` – `_melodyMinecraft()` + `minecraft` in Theme-Map
- `game.js` – Theme-Weiche für Steve Rendering

---

## Musik-Pause bei Lernkarten (11. April 2026)

- Musik pausiert automatisch wenn ein Fragezeichen-Dialog (Lernkarte) angezeigt wird
- Musik setzt nach "Weiter" automatisch fort
- `pauseMusic()` / `resumeMusic()` Methoden im AudioManager
- Gilt für alle Trigger-Typen (Zonen, Sprung, Bounce, Wand-Kollision)

---

## HiDPI / Retina Canvas (11. April 2026)

- Canvas-Auflösung passt sich automatisch an `devicePixelRatio` an
- Logische Spielfeldgröße bleibt 800×400 (`GAME_W` / `GAME_H` Konstanten)
- `resizeCanvas()` setzt echte Pixel-Dimensionen, `ctx.setTransform()` skaliert beim Render
- Reagiert auf Fenster-Resize (`window.addEventListener('resize')`)
- Scharfe Darstellung auf Retina-Displays (iPad, MacBook etc.)

---

## Fullscreen Canvas (11. April 2026)

- Canvas nimmt gesamte Gerätebreite ein (`width: 100vw`)
- Border entfernt (`border: none`)
- Touch-Controls ebenfalls auf volle Breite angepasst

---

## Sound & Musik (11. April 2026)

### Neues Modul: `modules/audio.js`
- Prozedurales Audio mit der Web Audio API – keine externen Audiodateien nötig
- `AudioManager`-Klasse mit AudioContext, Master/SFX/Music Gain-Nodes

### Sound-Effekte
| Sound | Auslöser | Beschreibung |
|-------|----------|--------------|
| Coin | Münze einsammeln | Aufsteigendes Retro-"Pling" (B5→E6→G6, Square-Wave) |
| Jump | Sprung | Kurzer aufsteigender Triangle-Ton (250→600 Hz) |
| Bounce | Trampolin-Kontakt | Federnder Sinus-Sweep (200→800→400 Hz) |
| Level Complete | Ziel erreicht | Fanfare: C-E-G-C (Square-Wave) |
| Game Over | Runtergefallen | Absteigender Sawtooth-Ton (400→80 Hz) |

### Level-Musik (Chiptune-Loops)
| Theme | Waveform | Stil | Tempo |
|-------|----------|------|-------|
| `normal` | Square | Fröhliche C-Dur Melodie | 0.14s/Note |
| `ice` | Triangle | Mysteriöse, kühle Moll-Töne | 0.20s/Note |
| `walle` | Sine | Warme, verträumte Melodie | 0.22s/Note |

- Musik startet automatisch beim Levelstart
- Musik stoppt bei Level Complete, Game Over, Reset

### Mute-Steuerung
- **Tastatur:** `M` zum Muten/Unmuten
- **HUD:** 🔊-Button oben mittig im Canvas (auch Touch/iPad)
- Mute-State toggelt Master-Gain zwischen 0 und 1

### Geänderte Dateien
- `modules/audio.js` – **NEU** – komplettes Audio-Modul
- `game.js` – Import AudioManager, Sound-Aufrufe bei Coin/Jump/Bounce/LevelComplete/GameOver, Musik Start/Stop, Mute-Button Handler
- `index.html` – Mute-Button im HUD hinzugefügt, Cache v=6
- `style.css` – `.hud-btn` Styling für Mute-Button

---

## Level 4: Wall-E findet Eve (8. April 2026)

### Neues Level
- **Theme:** `walle`
- **Story:** Wall-E muss Eve finden und retten
- **Level-Design:** Schrottplatz mit Sand (Müll bremst), Müllberge, Trampolin, Eis-Rutsche (glatter Metallboden), Aufstieg zu Eve

### Neue Charaktere
- **Wall-E** (Stickman-Ersatz in Level 4): Kastenförmiger Roboter mit Fernglas-Augen, Kettenantrieb (animiert), Würfel-Körper mit Müllklappe, Greifarme
- **Eve** (Ziel-Ersatz in Level 4): Eiförmig, schwebend, leuchtende Augen, wippende Arme, pulsierender "EVE"-Text

### Neue Lernfakten
| Fakt-ID | Titel | Icon |
|---------|-------|------|
| `walle_energy` | Energie & Recycling | 🔋 |
| `walle_solar` | Solarenergie | ☀️ |
| `walle_friction_metal` | Reibung auf Metall | ⚙️ |

### Geänderte Dateien
- `modules/level.js` – Level 4 Daten hinzugefügt
- `modules/stickman.js` – `drawWallE()` Methode
- `modules/ui.js` – `_drawEve()` + `drawGoal()` akzeptiert Theme-Parameter
- `modules/learn.js` – 3 neue Physik-Fakten
- `game.js` – Theme-Weiche für Wall-E/Eve Rendering

---

## Steuerung & Physik-Anpassungen (8. April 2026)

### Physik
| Parameter | Vorher | Nachher | Effekt |
|-----------|--------|---------|--------|
| `JUMP_FORCE` | -11 | -9.5 | Niedrigerer Sprung (~90px statt ~121px) |
| `MAX_SPEED` | 5 | 3.5 | Langsamere Bewegung, kürzere Sprungweite |
| `ACCELERATION` | 0.6 | 0.7 → 0.7 | Etwas direktere Reaktion |
| `friction (normal)` | 0.85 | 0.70 | Deutlich weniger Rutschen |
| `friction (trampolin)` | 0.85 | 0.70 | Konsistent mit Normal |
| Totzone | 0.1 | 0.3 | Winziges Gleiten sofort gestoppt |

### Level 2 Anpassung
- Zielplattform von y:200 auf y:240 gesenkt (erreichbar mit reduzierter Sprungkraft)
- Coin + Goal-Position entsprechend angepasst

### Touch-Steuerung (iPad)
- **Buttons vergrößert:** Richtung 80×80px (iPad: 88×88px), Jump 110×80px (iPad: 120×88px)
- **Multi-Touch-Tracking:** Jeder Finger wird individual getrackt, kein "Hängenbleiben" mehr
- **Neuer ≡-Button** für Level-Auswahl (Touch)

---

## Level-Auswahl (8. April 2026)

### Feature
- Neuer GameState `levelSelect` mit Canvas-gezeichnetem Auswahlmenü
- Freigeschaltete Levels als weiße Boxen mit ✓ (abgeschlossen) oder 🔒 (gesperrt)
- `maxLevelUnlocked` wird im localStorage gespeichert

### Steuerung
- **Tastatur:** `L` öffnet Auswahl, Zahlen 1-9 starten Level, `ESC` zurück
- **Touch/Klick:** Direkt auf Level-Box tippen
- **Mobile:** ≡-Button in Touch-Controls

### Reset-Verhalten
- `R` setzt Score + aktuelles Level zurück, **behält** freigeschaltete Levels

---

## Coin-Animation (8. April 2026)

- Zeitbasiert (600ms via `Date.now()`) statt framebasiert
- Münze vergrößert sich, schwebt nach oben, fadet aus
- "+10" Text erscheint und wächst mit

---

## Mobile Reset-Button (6. April 2026)

- ↺-Button in Touch-Controls neben Jump-Button
- Ruft `resetAll()` auf (wie Taste `R`)
