# Plan: Level 12 – Steinzeit („2. Platz")

## Stand

| Stufe | Status |
|---|---|
| 1. Leveldaten + Steinzeit-Hintergrund | ✅ fertig |
| 2. Bodenabschnitt mit Gegnern und Stalaktiten | ✅ fertig |
| 3. Klebeschuhe + Schwerkraft-Umkehr + Drehung | ✅ fertig |
| 4. Bogen (Rampe + Decke) und Rückweg mit Drache | ✅ fertig |
| 5. Bogenschießen inkl. Touch-Knopf | ✅ fertig |
| 6. Leitern und Klettern | ✅ fertig |
| 7. Burg, Absturz, Siegertreppchen mit Wertung | ✅ fertig |
| 8. Farbsteine | ✅ fertig |
| 9. Musik und Fragen | ✅ fertig |

**Level 12 ist komplett.**

**Wichtige Änderung gegenüber dem ursprünglichen Plan:** Das Umdrehen wird **nicht**
über eine Schwerkraft-Zone ausgelöst, sondern über den **Kopfkontakt mit der Decke**.
Die Simulation hatte gezeigt: Springt man kopfüber an der Decke, verlässt man die Zone
nach unten und kippt mitten im Sprung zurück. Jetzt gilt: Wer Klebeschuhe hat und mit
dem Kopf an eine Deckenplatte stößt, bleibt hängen. Zurück geht es erst, wenn man den
Deckenbereich seitlich verlässt – also über der Burg. Die `gravityZones` legen nur noch
fest, **wo** das überhaupt möglich ist.


Nach der Zeichnung. Das Level ist **keine Strecke von links nach rechts, sondern ein Rundweg**:
unten nach rechts, über den großen Bogen nach oben, **kopfüber** an der Decke zurück nach links,
und am Ende fällt man in die Burg und dreht sich wieder richtig herum.

```
   Burg (Ziel)                    ← ← ← kopfüber an der Decke ← ← ←
   ┌───────┐                                                    ╭─────╮
   │ ▐ Fahne│                                                 ╭──╯     │
   │ ▤ ▤   │                                              ╭──╯        │  ← Bogen
   └───────┘                                          ╭──╯            │
                                                  ╭──╯                │
   ▲ Start                                    ╭──╯                    │
   ╱▲╲   Höhle   Pflanze   Stachelvieh   Kiste                        │
  ───────────────────────────────────────────────────────────────────┘
   → → →  Hinweg über den Boden  → → →
```

## Die Elemente aus der Zeichnung

| Zeichnung | Im Spiel |
|---|---|
| Stickman auf dem Dreieck mit Bogen | Startpunkt, Steinzeit-Jäger mit Bogen |
| Hügel mit Höhle, zwei Wesen darin | Höhle mit zwei kleinen Gegnern |
| Blume mit Gesicht und Zacken | Fleischfressende Pflanze, schnappt nach oben |
| Kleines Stachelvieh am Boden | Patrouillierender Gegner |
| Borstiges Wesen auf eigener Plattform | Zweiter Gegner, höher platziert |
| Drei hängende Spitzen | Fallende Stalaktiten (Technik aus Level 11) |
| Kasten rechts mit zwei Kringeln | **Kiste mit den Klebeschuhen** |
| Großer Bogen rechts | Rampe hoch + Decke zum Zurücklaufen |
| Zacken an der Bogeninnenseite | Stacheln an der Decke, denen man ausweicht |
| Maul mit Zähnen + großes Auge oben | Höhlendrache – Hindernis auf dem Rückweg |
| Burg mit Leitern und Fahne | Ziel: Burg, Absturz + Drehung, Siegertreppchen |
| Rote Punkte | **Farbsteine** – ändern die Levelfarbe |

## Die neuen Mechaniken

### 1. Klebeschuhe → kopfüber laufen

Das Herzstück. In der Kiste rechts liegen die Klebeschuhe. Ab dann kann der Stickman
den Bogen hochlaufen und **an der Decke weiterlaufen, ohne herunterzufallen**.

**Wie es technisch geht** – die Engine kann fast alles schon:

* `applyGravity(player, gravity)` nimmt die Schwerkraft bereits als Parameter.
  Für kopfüber übergibt `game.js` einfach `gravity * player.gravitySign` (`+1` / `−1`).
* Sprung: `player.vy = JUMP_FORCE * player.gravitySign` – kopfüber springt man nach unten.
* **Einzige echte Änderung in `physics.js`:** `resolveCollisions()` lässt den Spieler bisher
  nur auf der *Oberseite* einer Plattform landen. Bei umgekehrter Schwerkraft muss die
  *Unterseite* zum Boden werden (`player.y = plat.y + plat.h`, `onGround = true`).
  Das ist ein Zweig in der bestehenden if-Abfrage, Level 1–11 bleiben unberührt.
* **Umschalten** über `gravityZones` in den Leveldaten – Rechtecke, in denen die Schwerkraft
  kippt, aber nur mit Klebeschuhen. Der Bogen-Scheitel liegt in so einer Zone, die Burg nicht.
  Genau das, was du beschrieben hast: in der Burg fällt er wieder runter.
* **Die Drehung:** `flipTimer` blendet die Figur über ~20 Frames von 0° auf 180°
  (`ctx.rotate`). Beim Absturz in die Burg dreht sie sich zurück.

**Der Bogen selbst** wird aus zwei Teilen gebaut:
* Aufstieg rechts: Schrägplattformen (`slope`) – die kann die Engine schon, daher läuft man
  hoch statt zu springen und behält den Schwung.
* Decke: normale Plattformen, an deren Unterseite man kopfüber läuft.
* Gezeichnet wird darüber ein glatter Steinbogen, damit man die Stufen nicht sieht.

**Ohne Klebeschuhe** kommt man den Bogen nicht hoch – die Kiste ist also Pflicht.

### 2. Der Bogen – schießen

Der Stickman kann mit dem Bogen schießen. Neue Taste **E**, auf dem Touch-Screen ein
zusätzlicher Knopf **🏹** neben dem Sprungknopf.

* **Pfeile fliegen im Bogen**, nicht geradeaus – sie bekommen eine leichte Schwerkraft
  (`0.12` statt `0.5`). Damit muss man ein bisschen vorhalten, und es zeigt nebenbei
  echte Wurfphysik. Kopfüber fliegt der Pfeil entsprechend andersherum.
* **Nachladezeit** von etwa 25 Frames, dafür unbegrenzt Pfeile – kein Zählen, kein Frust.
* Ein Treffer schaltet einen Gegner aus (dieselbe „knocked"-Logik wie beim Roundhouse-Kick)
  und gibt Punkte.
* Der Spann-Moment wird kurz animiert: Bogen gespannt, Sehne zurück, dann Schuss.
* Fliegt der Pfeil aus dem Bild oder trifft Fels, verschwindet er.

Neuer Skin `drawCaveman()`: Fellkleidung, wilde Haare, Bogen in der Hand.

### 3. Leitern – klettern

In der Burg (und an einer Stelle im Aufstieg) hängen Leitern.

* `ladders: [{x, y, w, h}]` in den Leveldaten.
* Steht man auf einer Leiter, schaltet die Schwerkraft ab und man klettert mit
  **↑ / ↓** (bzw. **W / S**) hoch und runter.
* **Leertaste** springt jederzeit von der Leiter ab.
* Auf dem Touch-Screen erscheint ein **▼-Knopf**, solange man an einer Leiter steht –
  hoch geht es mit dem vorhandenen ▲-Knopf.
* Achtung bei der Tastenbelegung: Schießen liegt deshalb auf **E** und nicht auf **S**,
  damit **S** zum Runterklettern frei bleibt.

### 4. Farbsteine – blau, gelb, rot

Über das Level verteilt liegen farbige Steine. Wer einen berührt, **färbt das ganze Level um**.

* Levelfarbe (`tint`) wirkt auf Hintergrund, Felsen und Umrisse.
* **Die Steine bleiben liegen** – man kann jederzeit zurücklaufen und die Farbe wieder
  wechseln. Punkte gibt es nur beim ersten Mal, damit man sie nicht endlos abgreifen kann.
* Von jeder Farbe liegen mehrere im Level verteilt.
* Passt zur Steinzeit: die drei Farben sind genau die der Höhlenmalerei –
  Rot (Ocker), Gelb (Ocker), Blau (Kohle-Blau).
* Rein optisch, kein Einfluss auf das Gameplay – es soll einfach cool aussehen.

Technisch: `ui.js` bekommt eine Mischfunktion `_mix(farbeA, farbeB, anteil)`, und
`drawBackground` / `drawPlatforms` mischen die Grundfarbe mit dem aktuellen Tint.

### 5. Steinzeit-Look

* Hintergrund: Felswand mit **Höhlenmalerei** im Parallax – Handabdrücke, Mammut,
  Jagdszene, Strichmännchen
* Untergründe: `stein` (normal), `moos` (etwas rutschig), evtl. `matsch` (bremst stark)
* Musik: Trommeln plus einfache Flötenmelodie in Pentatonik – archaisch, treibend

## Die Gegner

| Gegner | Verhalten |
|---|---|
| **Höhlenviecher** (2 Stück) | Laufen in der Höhle hin und her, kommen heraus wenn man näher kommt |
| **Fleischfressende Pflanze** | Steht fest, schnappt im Takt nach oben – Timing-Hindernis |
| **Stachelvieh** | Patrouilliert am Boden, muss übersprungen werden |
| **Borstenvieh** | Wie oben, aber auf einer erhöhten Plattform |
| **Höhlendrache** (Maul + Auge) | Sitzt an der Decke auf dem Rückweg, öffnet und schließt das Maul im Takt |
| **Stalaktiten** | Fallen von der Decke – Technik aus Level 11, hier von der Bogeninnenseite |

## Das Ziel: die Burg und das Siegertreppchen

Am Ende des Deckenwegs endet die Schwerkraft-Zone: der Stickman **fällt in die Burg
und dreht sich dabei zurück**. Innen führen Leitern nach oben zur Fahne, unten steht
das Siegertreppchen mit den Plätzen **1, 2 und 3**.

**Wie der Platz zustande kommt:**

| Platz | Bedingung |
|---|---|
| 🥉 **3. Platz** | Du hast es bis zur Burg geschafft |
| 🥈 **2. Platz** | Mindestens 60 % der möglichen Punkte |
| 🥇 **1. Platz** | Mindestens 90 % der Punkte **und** kein einziger Treffer |

Der Stickman stellt sich auf die passende Stufe, bekommt eine Medaille, und im
Abschlussbild steht, was zum nächsten Platz noch gefehlt hat. Beim ersten Durchlauf
landet man realistisch auf dem 2. Platz – genau wie in der Zeichnung – und hat einen
Grund, es nochmal zu versuchen.

**Treffer statt Tod:** In diesem Level töten die Gegner nicht. Wer getroffen wird, wird
zurückgestoßen und bekommt einen Treffer auf die Wertungsliste. Nur wer in eine Lücke
fällt, muss neu anfangen. Das hält das Level fair, obwohl viel los ist.

## Steuerung (neu in diesem Level)

| Taste | Touch | Funktion |
|---|---|---|
| ← → | ◀ ▶ | Laufen (auch kopfüber) |
| Leertaste / ↑ | ▲ | Springen, auch von der Leiter weg |
| ↑ ↓ bzw. W S | ▲ ▼ | Klettern, solange man an einer Leiter steht |
| **E** | **🏹** | Pfeil schießen |

## Reihenfolge beim Bauen

1. Leveldaten + Steinzeit-Hintergrund (sichtbares Grundgerüst)
2. Boden-Abschnitt mit Gegnern und Stalaktiten
3. Klebeschuhe + Schwerkraft-Umkehr + Drehung ← das Herzstück
4. Bogen (Rampe + Decke) und der Rückweg mit Drache
5. Bogenschießen inkl. Touch-Knopf
6. Leitern und Klettern
7. Burg, Absturz, Siegertreppchen mit Wertung
8. Farbsteine
9. Musik und Lernkarten

## Prüfen

Der Simulator aus Level 11 wird erweitert: er spielt die Strecke mit der echten Physik durch –
diesmal inklusive Schwerkraft-Umkehr – und beweist, dass der Rundweg mit Klebeschuhen
schaffbar und ohne sie blockiert ist.

---
*Erstellt: 2026-08-02*
