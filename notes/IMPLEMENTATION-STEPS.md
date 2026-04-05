# Stickman Physics Jump & Run – Implementierungsplan

> Ein kindgerechtes Jump-and-Run-Spiel mit einem Stickman als Spielfigur,
> das Physikkonzepte spielerisch vermittelt.

---

## Technologie-Stack

- **Sprache:** Vanilla JavaScript (kein Framework nötig)
- **Rendering:** HTML5 Canvas API
- **Game Loop:** `requestAnimationFrame`
- **Speicherung:** `localStorage` für Fortschritt & Score
- **Plattform:** Browser (Desktop + Mobile / Touch)

---

## Phase 1 – Spielgrundlage

**Ziel:** Lauffähiges Grundgerüst mit Stickman und Steuerung.

### 1.1 Projektstruktur

```
stickman-game/
├── index.html
├── style.css
├── game.js
├── modules/
│   ├── stickman.js
│   ├── physics.js
│   ├── level.js
│   ├── ui.js
│   └── learn.js
└── assets/
    └── sounds/ (optional)
```

### 1.2 HTML Canvas Setup

```html
<canvas id="gameCanvas" width="800" height="400"></canvas>
```

- Canvas-Größe responsiv über CSS skalieren
- Touch-Overlay-Buttons für Mobile (Links, Rechts, Springen)

### 1.3 Stickman zeichnen (`stickman.js`)

Stickman besteht aus einfachen Canvas-Primitiven:

| Teil | Form |
|---|---|
| Kopf | `arc()` – Kreis |
| Rumpf | `lineTo()` – Linie |
| Arme | `lineTo()` – 2 Linien |
| Beine | `lineTo()` – 2 Linien (animiert beim Laufen) |

```javascript
// Beispiel: Kopf zeichnen
ctx.beginPath();
ctx.arc(x, y - 30, 12, 0, Math.PI * 2);
ctx.stroke();
```

### 1.4 Game Loop

```javascript
function gameLoop(timestamp) {
  update(timestamp);   // Physik & Logik
  render();            // Zeichnen
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

### 1.5 Steuerung

- **Tastatur:** `ArrowLeft`, `ArrowRight`, `Space` (Springen)
- **Touch:** Virtuelle Buttons per `touchstart` / `touchend`
- Input-State als Boolean-Objekt (`keys.left`, `keys.right`, `keys.jump`)

---

## Phase 2 – Physik-Engine

**Ziel:** Realistische Bewegung durch echte Physik-Simulation.

### 2.1 Grundlegende Physik-Variablen

```javascript
const GRAVITY    = 0.5;   // Pixel/Frame² – Erdbeschleunigung
const JUMP_FORCE = -12;   // Negativer Wert = nach oben
const FRICTION   = 0.85;  // Dämpfung der horizontalen Bewegung (0–1)
const MAX_SPEED  = 6;     // Maximale horizontale Geschwindigkeit
```

### 2.2 Bewegungsupdate pro Frame

```javascript
// Schwerkraft anwenden
player.vy += GRAVITY;

// Position aktualisieren
player.x  += player.vx;
player.y  += player.vy;

// Reibung (nur am Boden)
if (player.onGround) {
  player.vx *= FRICTION;
}
```

### 2.3 Kollisionserkennung (AABB)

Axis-Aligned Bounding Box – einfache Rechteck-Kollision:

```javascript
function checkCollision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
```

- Kollision von oben → Stickman landet auf Plattform (`onGround = true`)
- Kollision von der Seite → Bewegung stoppen
- Kollision mit Hindernis → Physik-Lernfakt auslösen

### 2.4 Sprungmechanik

```javascript
if (keys.jump && player.onGround) {
  player.vy = JUMP_FORCE;
  player.onGround = false;
  triggerLearnFact("jump");  // Lerninhalt auslösen
}
```

### 2.5 Verschiedene Untergründe (Reibungswerte)

| Untergrund | Reibung | Lernfakt |
|---|---|---|
| Normalboden | 0.85 | – |
| Eis | 0.98 | Reibung & Trägheit |
| Sand | 0.60 | Dämpfung |
| Trampolin | Bounce-Faktor | Elastizität |

---

## Phase 3 – Lerninhalt: Physik

**Ziel:** Physik-Konzepte werden direkt durch Spielerlebnisse vermittelt.

### 3.1 Lernmomente & Trigger

Lernfakten erscheinen als animierte Info-Karten, wenn der Spieler bestimmte Aktionen ausführt:

| Aktion | Physik-Konzept | Kindgerechte Erklärung |
|---|---|---|
| Springen | Newtons 3. Gesetz | „Du drückst den Boden – der Boden drückt zurück!" |
| Vom Eis rutschen | Reibung | „Auf Eis gibt es fast keine Reibung – deshalb rutschst du!" |
| Fallen lassen | Freier Fall | „Ohne Boden zieht dich die Schwerkraft immer schneller nach unten!" |
| Hohe Plattform | Potenzielle Energie | „Je höher du bist, desto mehr Energie steckt in dir!" |
| Schnell laufen | Kinetische Energie | „Bewegung = Energie! Je schneller, desto mehr!" |
| Gegen Wand laufen | Impuls & Kollision | „Beim Aufprall überträgst du Energie auf die Wand!" |

### 3.2 Info-Karten (UI-Overlay)

```javascript
function showLearnCard(fact) {
  // Karte einblenden mit Animation
  // Titel + Erklärung + optionales Quiz
  // Nach 4 Sekunden automatisch ausblenden
}
```

Design der Karte:
- Großes Emoji / Icon (z.B. ⬆️ für Sprung)
- Kurzer Titel (max. 5 Wörter)
- Erklärung in 1–2 Sätzen, kindgerecht
- Optional: „Weiter"-Button

### 3.3 Quiz-System (optional, Phase 3b)

Nach bestimmten Levels erscheint eine Quiz-Frage:

```javascript
const quizzes = [
  {
    question: "Warum rutscht du auf Eis weiter?",
    answers: ["Zu viel Schwung", "Wenig Reibung", "Zu wenig Gewicht"],
    correct: 1,
    reward: 50  // Bonuspunkte
  }
];
```

- Richtige Antwort → Bonuspunkte + kurze Erklärung
- Falsche Antwort → Hinweis, kein Gameover

---

## Kernmodule – Übersicht

### `physics.js`

- `applyGravity(player)`
- `applyFriction(player, surface)`
- `resolveCollision(player, platforms)`
- `calculateKineticEnergy(mass, velocity)` ← für Anzeige

### `stickman.js`

- `draw(ctx, state)` – Zeichnet je nach Zustand (laufen, springen, stehen)
- `animate(frame)` – Beinanimation beim Laufen

### `level.js`

- `loadLevel(id)` – Lädt Plattformen, Hindernisse, Lernpunkte
- `scrollWorld(speed)` – Horizontales Scrollen der Welt
- `spawnObstacle()` – Zufällige Hindernisse generieren

### `learn.js`

- `triggerFact(eventType)` – Löst passenden Lernfakt aus
- `showCard(fact)` – Animierte Karte anzeigen
- `showQuiz(quiz)` – Quiz einblenden

### `ui.js`

- `drawHUD(score, energy)` – Punktestand & Energie-Anzeige
- `drawPhysicsInfo(velocity, height)` – Live-Physikwerte (optional)
- `drawTouchControls()` – Mobile-Buttons

---

## Levels & Progression

| Level | Thema | Neue Mechanik | Neuer Lernfakt |
|---|---|---|---|
| 1 | Tutorial | Laufen, einfache Sprünge | Schwerkraft |
| 2 | Eishöhle | Rutschiger Untergrund | Reibung & Trägheit |
| 3 | Sprungturm | Hohe Plattformen | Potenzielle Energie |
| 4 | Geschwindigkeitsparcours | Beschleunigungsfelder | Kinetische Energie |
| 5 | Kollisionszone | Bewegliche Hindernisse | Impuls & Stoß |
| 6+ | Boss-Level | Alle Mechaniken kombiniert | Newton-Quiz |

---

## Fortschritt & Score

```javascript
// localStorage Struktur
const saveData = {
  level:         3,
  score:         1250,
  factsLearned:  ["gravity", "friction", "energy"],
  quizzesSolved: 2
};
localStorage.setItem("stickmanSave", JSON.stringify(saveData));
```

Score-System:
- +10 Punkte pro Hindernis überwunden
- +50 Punkte pro richtig beantworteter Quizfrage
- +100 Punkte pro abgeschlossenem Level

---

## Responsive / Mobile

- Canvas-Skalierung via `canvas.style.width = "100%"`
- Touch-Controls: 3 Buttons (◀ ▶ ▲) als HTML-Overlay
- Event-Listener für `touchstart`, `touchend` analog zu Tastaturtasten

---

## Empfohlene Reihenfolge der Implementierung

1. `index.html` + Canvas + Game Loop (ca. 1–2h)
2. Stickman zeichnen + Grundbewegung (ca. 1–2h)
3. Physik: Schwerkraft + Sprung + Kollision (ca. 2–3h)
4. Level 1 mit einfachen Plattformen (ca. 1–2h)
5. Lernkarten-System + erste 3 Fakten (ca. 1–2h)
6. Weitere Levels + Physik-Varianten (ca. 3–5h)
7. Quiz-System + Score + Mobile (ca. 2–3h)
8. Feinschliff: Animationen, Sound, UI-Polishing (ca. 2–4h)

**Gesamtaufwand:** ~14–23 Stunden (Einzelperson)

---

*Erstellt mit Claude – Anthropic*
