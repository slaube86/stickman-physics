// game.js – Haupt-Game-Loop, bringt alle Module zusammen

import { Stickman } from "./modules/stickman.js?v=32";
import {
  applyGravity,
  applyMovement,
  applyFriction,
  applyPosition,
  resolveCollisions,
  getCurrentSurface,
  JUMP_FORCE,
  DEFAULT_GRAVITY,
} from "./modules/physics.js?v=32";
import { loadLevel, getTotalLevels } from "./modules/level.js?v=32";
import { LearnSystem } from "./modules/learn.js?v=32";
import { UI, setupTouchControls } from "./modules/ui.js?v=32";
import { AudioManager } from "./modules/audio.js?v=32";

// ─── Canvas Setup ──────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Logische Spielfeldgröße (alle Koordinaten beziehen sich hierauf)
const GAME_W = 800;
const GAME_H = 400;

// Gegner-Größe (in Pixel)
const ENEMY_W = 18;
const ENEMY_H = 38;

// HiDPI-Canvas: Auflösung an tatsächliche Pixeldichte anpassen
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ─── Game State ────────────────────────────────────────────
const keys = {
  left: false,
  right: false,
  jump: false,
  shoot: false,
  up: false, // klettern hoch
  down: false, // klettern runter
};
let currentLevelId = 1;
let maxLevelUnlocked = 1;
let level = null;
let player = null;
let camera = 0;
let cameraY = 0;
let score = 0;
let gameState = "menu"; // menu, playing, levelSelect, levelComplete, gameOver
let lastTime = 0;
let levelCompleteTimer = 0;
let enemies = []; // aktive Gegner im aktuellen Level
let spikes = []; // fallende Eiszapfen (Zahlenland)

// ─── Zahlen-Modus (Level 11) ───────────────────────────────
let playerNumber = 1; // Der Spieler IST diese Zahl
let invincible = false; // ab Zahl 10
let hitTimer = 0; // Unverwundbarkeit nach einem Treffer (Frames)
let specialAnimTimer = 0; // Spezial-Animation bei voller Punktzahl
let floatTexts = []; // schwebende "+15" / "−1" Texte

// ─── Steinzeit (Level 12) ──────────────────────────────────
let hits = 0; // Treffer zählen für die Wertung auf dem Siegertreppchen
let hasStickyShoes = false; // Klebeschuhe eingesammelt?
let gravitySign = 1; // 1 = normal, -1 = kopfüber an der Decke
let flipAngle = 0; // Drehung der Figur (0 … π), wird weich animiert
let items = []; // einsammelbare Gegenstände (Klebeschuhe)
let hazards = []; // feststehende Steinzacken
let arrows = []; // fliegende Pfeile
let shootCooldown = 0; // Nachladezeit in Frames
let onLadder = false; // hängt gerade an einer Leiter
let levelStartScore = 0; // Punktestand beim Levelstart, für die Wertung
let placement = 0; // erreichter Platz auf dem Siegertreppchen (1–3)
let colorStones = []; // Farbsteine, die das Level umfärben
let tint = null; // aktuelle Levelfarbe, wird weich überblendet

// Die drei Farben der Höhlenmalerei
const STONE_COLORS = {
  blau: [120, 165, 255],
  gelb: [255, 214, 110],
  rot: [255, 124, 106],
};

// ─── Systeme ───────────────────────────────────────────────
const ui = new UI(canvas);
const learnSystem = new LearnSystem();
const audio = new AudioManager();

// Richtig gelöste Rechenaufgabe → Bonuspunkte
learnSystem.onAnswer = (correct) => {
  if (correct) {
    score += 25;
    audio.playCorrect();
    if (player) addFloatText(player.x + player.w / 2, player.y - 10, "+25");
  } else {
    audio.playWrong();
  }
};

// ─── Save / Load ───────────────────────────────────────────
function saveProgress() {
  const data = {
    level: currentLevelId,
    maxLevel: maxLevelUnlocked,
    score: score,
    factsLearned: [...learnSystem.shownFacts],
  };
  try {
    localStorage.setItem("stickmanSave", JSON.stringify(data));
  } catch {
    // localStorage nicht verfügbar, ignorieren
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem("stickmanSave");
    if (raw) {
      const data = JSON.parse(raw);
      currentLevelId = data.level || 1;
      maxLevelUnlocked = data.maxLevel || data.level || 1;
      score = data.score || 0;
      if (data.factsLearned) {
        data.factsLearned.forEach((f) => learnSystem.shownFacts.add(f));
      }
    }
  } catch {
    // Fehler beim Laden ignorieren
  }
}

// ─── Level laden ───────────────────────────────────────────
function startLevel(id) {
  audio.init(); // AudioContext bei erster Interaktion starten
  level = loadLevel(id);
  if (!level) {
    gameState = "menu";
    audio.stopMusic();
    return;
  }
  currentLevelId = id;
  player = new Stickman(level.spawnX, level.spawnY);
  camera = 0;
  cameraY = 0;
  gameState = "playing";
  levelCompleteTimer = 0;
  // Gegner aus Level-Daten instanziieren
  enemies = (level.enemies || []).map((e) => {
    const kind = e.kind || "critter";
    // Pflanze und Drache sind größer und stehen fest
    const w = kind === "plant" ? 26 : kind === "dragon" ? 40 : ENEMY_W;
    const h = kind === "plant" ? 46 : kind === "dragon" ? 52 : ENEMY_H;
    return {
      x: e.x,
      // Deckenbewohner hängen nach unten, alle anderen stehen oben drauf
      y: e.ceiling ? e.platformY : e.platformY - h,
      ceiling: !!e.ceiling,
      w,
      h,
      vx: e.speed || 1.2,
      speed: e.speed || 1.2,
      patrolLeft: e.patrolLeft,
      patrolRight: e.patrolRight,
      state: "patrol", // patrol | knocked | dead
      facing: 1,
      knockTimer: 0,
      jumpedOver: false,
      // Steinzeit: critter | bristle | plant | dragon
      kind,
      arrowProof: !!e.arrowProof, // Drachenschuppen halten Pfeile ab
      shieldFlash: 0,
      snapCycle: e.snapCycle || 110,
      snapTimer: e.snapPhase || 0,
      snapping: false,
      snapProgress: 0,
    };
  });
  // Fallende Eiszapfen instanziieren
  spikes = (level.spikes || []).map((s) => ({
    x: s.x,
    y0: s.y,
    y: s.y,
    w: 12,
    h: 20,
    vy: 0,
    floorY: s.floorY,
    cycle: s.cycle || 180,
    state: "hang", // hang | fall | broken
    timer: (s.phase || 0) + 60, // Schonfrist beim Levelstart
  }));
  // Zahlen-Modus zurücksetzen
  playerNumber = 1;
  invincible = false;
  hitTimer = 0;
  specialAnimTimer = 0;
  floatTexts = [];
  // Steinzeit zurücksetzen
  hits = 0;
  hasStickyShoes = false;
  gravitySign = 1;
  flipAngle = 0;
  player.gravitySign = 1;
  items = (level.items || []).map((it) => ({ ...it, taken: false }));
  hazards = level.hazards || [];
  arrows = [];
  shootCooldown = 0;
  onLadder = false;
  levelStartScore = score;
  placement = 0;
  colorStones = (level.colorStones || []).map((s) => ({ ...s, used: false }));
  tint = null;
  ui.setBowVisible(!!level.bow);
  audio.startMusic(level.theme);
}

function resetAll() {
  currentLevelId = 1;
  score = 0;
  learnSystem.reset();
  saveProgress();
  audio.stopMusic();
  gameState = "menu";
}

// ─── Input ─────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
    e.preventDefault();
    keys.jump = true;
  }
  // Hoch/Runter zum Klettern an Leitern
  if (e.code === "ArrowUp" || e.code === "KeyW") keys.up = true;
  if (e.code === "ArrowDown" || e.code === "KeyS") {
    e.preventDefault();
    keys.down = true;
  }
  // E = Pfeil schießen (S bleibt fürs Runterklettern frei)
  if (e.code === "KeyE") keys.shoot = true;
  // Menü: Enter zum Starten
  if (e.code === "Enter" || e.code === "Space") {
    if (gameState === "menu") {
      startLevel(currentLevelId);
    } else if (gameState === "gameOver") {
      startLevel(currentLevelId);
    }
  }
  // L = Level-Auswahl
  if (e.code === "KeyL") {
    if (gameState === "menu" || gameState === "playing") {
      gameState = "levelSelect";
    }
  }
  // Escape = Zurück zum Menü
  if (e.code === "Escape") {
    if (gameState === "levelSelect") {
      gameState = "menu";
    }
  }
  // Zahlen 1-9 in Level-Auswahl
  if (gameState === "levelSelect") {
    const num = parseInt(e.key);
    if (num >= 1 && num <= maxLevelUnlocked && num <= getTotalLevels()) {
      startLevel(num);
    }
  }
  // R = Kompletter Neustart
  if (e.code === "KeyR") {
    resetAll();
  }
  // M = Mute/Unmute
  if (e.code === "KeyM") {
    audio.init();
    audio.toggleMute();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")
    keys.jump = false;
  if (e.code === "ArrowUp" || e.code === "KeyW") keys.up = false;
  if (e.code === "ArrowDown" || e.code === "KeyS") keys.down = false;
  if (e.code === "KeyE") keys.shoot = false;
});

// ─── Weltkarte: Knoten-Positionen & Farben ────────────────
const MAP_NODES = [
  { id: 1, x:  75, y: 325, theme: "normal",   name: "Tutorial"   },
  { id: 2, x: 162, y: 195, theme: "ice",       name: "Eishöhle"   },
  { id: 3, x: 258, y: 290, theme: "normal",    name: "Sprungturm" },
  { id: 4, x: 368, y: 342, theme: "walle",     name: "Wall-E"     },
  { id: 5, x: 455, y: 208, theme: "minecraft", name: "Minecraft"  },
  { id: 6, x: 528, y:  72, theme: "space",     name: "Weltraum"   },
  { id: 7, x: 638, y: 198, theme: "ninjago",   name: "Ninjago"    },
  { id: 8, x: 712, y: 110, theme: "clockwork", name: "Clockwork"  },
  { id: 9, x: 752, y: 312, theme: "desert",    name: "Wüste"      },
  { id: 10, x: 690, y: 355, theme: "skatepark", name: "Skatepark"  },
  { id: 11, x: 560, y: 352, theme: "numbers",   name: "Zahlenland" },
  { id: 12, x: 432, y: 268, theme: "stoneage",  name: "Steinzeit"  },
];

const NODE_RGB = {
  normal:    [160, 160, 160],
  ice:       [100, 185, 225],
  walle:     [165, 120,  48],
  minecraft: [ 78, 165,  58],
  space:     [ 40,  60, 120],
  ninjago:   [155,  22,  22],
  clockwork: [185, 132,  58],
  desert:    [215, 142,  38],
  skatepark: [180,  60, 220],
  numbers:   [110, 210, 200],
  stoneage:  [175, 105,  50],
};

function drawLevelSelect() {
  // ── Hintergrund ──────────────────────────────────────────
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Biom-Leuchtflecken pro Level
  for (const node of MAP_NODES) {
    const [r, g, b] = NODE_RGB[node.theme] || [120, 120, 120];
    const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 95);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
  }

  // Vignette (Kanten abdunkeln)
  const vig = ctx.createRadialGradient(
    GAME_W / 2, GAME_H / 2, 80,
    GAME_W / 2, GAME_H / 2, GAME_W * 0.75,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // ── Pfade zwischen den Knoten ─────────────────────────────
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 6]);
  for (let i = 0; i < MAP_NODES.length - 1; i++) {
    const a = MAP_NODES[i];
    const b = MAP_NODES[i + 1];
    const unlocked = b.id <= maxLevelUnlocked;

    // Leicht gebogener Pfad (senkrecht versetzter Kontrollpunkt)
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const cpx = mx + (-dy / len) * 18;
    const cpy = my + ( dx / len) * 18;

    ctx.strokeStyle = unlocked
      ? "rgba(255,255,255,0.30)"
      : "rgba(255,255,255,0.07)";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(cpx, cpy, b.x, b.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // ── Knoten ────────────────────────────────────────────────
  const R = 18;
  for (const node of MAP_NODES) {
    const unlocked  = node.id <= maxLevelUnlocked;
    const completed = node.id < maxLevelUnlocked;
    const [r, g, b] = NODE_RGB[node.theme] || [120, 120, 120];

    // Pulsierender Ring für das aktuell ausgewählte Level
    if (node.id === currentLevelId && unlocked) {
      const pulse = Math.sin(Date.now() / 380) * 4;
      ctx.beginPath();
      ctx.arc(node.x, node.y, R + 8 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},0.22)`;
      ctx.fill();
    }

    // Innenfläche
    ctx.beginPath();
    ctx.arc(node.x, node.y, R, 0, Math.PI * 2);
    ctx.fillStyle = unlocked
      ? `rgba(${r},${g},${b},0.28)`
      : "rgba(18,18,22,0.88)";
    ctx.fill();

    // Rand
    ctx.beginPath();
    ctx.arc(node.x, node.y, R, 0, Math.PI * 2);
    ctx.strokeStyle = unlocked ? `rgb(${r},${g},${b})` : "#333";
    ctx.lineWidth = unlocked ? 2 : 1;
    ctx.stroke();

    // Level-Nummer (nur bei entsperrten; bei gesperrten kommt Schloss)
    if (unlocked) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.id, node.x, node.y + 0.5);
    } else {
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🔒", node.x, node.y + 0.5);
    }

    // Name-Label unterhalb
    ctx.fillStyle = unlocked ? "rgba(255,255,255,0.65)" : "#282828";
    ctx.font = "9px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(node.name, node.x, node.y + R + 3);

    // Häkchen oberhalb bei abgeschlossenen Levels
    if (completed) {
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.font = "bold 11px sans-serif";
      ctx.textBaseline = "bottom";
      ctx.fillText("✓", node.x, node.y - R - 1);
    }
  }

  // ── Titel ─────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("WELTKARTE", GAME_W / 2, 10);

  // Dekorative Unterlinie
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  const tw = ctx.measureText("WELTKARTE").width;
  ctx.beginPath();
  ctx.moveTo(GAME_W / 2 - tw / 2, 34);
  ctx.lineTo(GAME_W / 2 + tw / 2, 34);
  ctx.stroke();

  // Hinweiszeile unten
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.font = "11px sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    "ESC = Zurück  ·  Zahl drücken zum Auswählen",
    GAME_W / 2,
    GAME_H - 6,
  );

  // Kartenrahmen
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.strokeRect(3, 3, GAME_W - 6, GAME_H - 6);
}

// Touch/Klick auf Canvas
canvas.addEventListener("click", (e) => {
  if (gameState === "levelSelect") {
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_W / rect.width;
    const scaleY = GAME_H / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    for (const node of MAP_NODES) {
      const dx = clickX - node.x;
      const dy = clickY - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= 22 && node.id <= maxLevelUnlocked) {
        startLevel(node.id);
        return;
      }
    }
    return;
  }

  if (gameState === "menu" || gameState === "gameOver") {
    startLevel(currentLevelId);
  }
});

setupTouchControls(keys);

// Touch Reset-Button
document.getElementById("btn-reset").addEventListener("click", () => {
  resetAll();
});

// Touch Level-Select Button
document.getElementById("btn-levels").addEventListener("click", () => {
  if (gameState === "levelSelect") {
    gameState = "menu";
  } else {
    gameState = "levelSelect";
  }
});

// Mute-Button
const muteBtn = document.getElementById("btn-mute");
muteBtn.addEventListener("click", () => {
  audio.init();
  const muted = audio.toggleMute();
  muteBtn.textContent = muted ? "🔇" : "🔊";
});

// ─── Zahlen-Modus: Hilfsfunktionen ─────────────────────────
function addFloatText(x, y, text) {
  floatTexts.push({ x, y, text, life: 60 });
}

function updateFloatTexts() {
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const f = floatTexts[i];
    f.y -= 0.7;
    f.life--;
    if (f.life <= 0) floatTexts.splice(i, 1);
  }
}

// Gegner wegschleudern
function knockEnemy(e, dir, force = 9) {
  e.state = "knocked";
  e.knockTimer = 50;
  e.vx = dir * force;
  e.vy = -7;
  score += 20;
  audio.playBounce();
}

// Roundhouse-Kick auf einen Gegner
function kickEnemy(e) {
  player.kickTimer = 22;
  const dir = e.x + e.w / 2 > player.x + player.w / 2 ? 1 : -1;
  player.facing = dir;
  knockEnemy(e, dir);
}

// ─── Pfeil und Bogen ───────────────────────────────────────
function shootArrow() {
  shootCooldown = 25;
  player.shootTimer = 12;

  const dir = player.facing;
  // Kopfüber sitzt die Hand auf der anderen Körperseite
  const handY =
    gravitySign === 1 ? player.y + 18 : player.y + player.h - 18;

  arrows.push({
    x: player.x + player.w / 2 + dir * 16,
    y: handY,
    vx: dir * 9,
    vy: 0,
    // Pfeile fliegen im Bogen – deutlich leichter als der Spieler
    g: 0.08 * gravitySign,
    life: 200,
  });
  audio.playArrow();
}

function updateArrows() {
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.vy += a.g;
    a.x += a.vx;
    a.y += a.vy;
    a.life--;

    let gone = a.life <= 0;

    // Gegner treffen
    if (!gone) {
      for (const e of enemies) {
        if (e.state === "knocked" || e.state === "dead") continue;
        if (
          a.x > e.x &&
          a.x < e.x + e.w &&
          a.y > e.y &&
          a.y < e.y + e.h
        ) {
          if (e.arrowProof) {
            // Der Pfeil prallt an den Schuppen ab
            e.shieldFlash = 18;
            addFloatText(a.x, a.y - 8, "Pling!");
            audio.playWrong();
          } else {
            knockEnemy(e, Math.sign(a.vx) || 1, 7);
            addFloatText(e.x + e.w / 2, e.y - 10, "Treffer!");
          }
          gone = true;
          break;
        }
      }
    }

    // Im Fels stecken bleiben
    if (!gone) {
      for (const p of level.platforms) {
        if (p.slope !== undefined) continue;
        if (
          a.x > p.x &&
          a.x < p.x + p.w &&
          a.y > p.y &&
          a.y < p.y + p.h
        ) {
          gone = true;
          break;
        }
      }
    }

    if (gone) arrows.splice(i, 1);
  }
}

// Treffer: Die Zahl schrumpft (aus einer 3 wird wieder eine 2)
function damagePlayer(knockDir) {
  if (hitTimer > 0 || invincible || gameState !== "playing") return;

  playerNumber--;
  hitTimer = 90;
  player.vx = knockDir * 5;
  player.vy = -5;
  player.onGround = false;
  audio.playNumberDown();
  addFloatText(player.x + player.w / 2, player.y - 6, "−1");

  if (playerNumber < 1) {
    playerNumber = 0;
    gameState = "gameOver";
    audio.stopMusic();
    audio.playGameOver();
  }
}

// Treffer im Steinzeit-Level: zurückstoßen, aber niemand stirbt.
// Die Treffer zählen später für die Wertung auf dem Siegertreppchen.
function hitPlayer(knockDir) {
  if (hitTimer > 0 || gameState !== "playing") return;

  hits++;
  hitTimer = 75;
  player.vx = knockDir * 5;
  player.vy = -4.5;
  player.onGround = false;
  audio.playNumberDown();
  addFloatText(player.x + player.w / 2, player.y - 6, "Autsch!");
}

// ─── Leitern ───────────────────────────────────────────────
const CLIMB_SPEED = 2.4;

function ladderUnderPlayer() {
  const pb = player.getBounds();
  const cx = pb.x + pb.w / 2;
  for (const l of level.ladders || []) {
    if (
      cx > l.x - 6 &&
      cx < l.x + l.w + 6 &&
      pb.y + pb.h > l.y &&
      pb.y < l.y + l.h
    ) {
      return l;
    }
  }
  return null;
}

// Gibt true zurück, wenn geklettert wird – dann übernimmt die Leiter
// die Bewegung und die normale Physik pausiert.
function updateLadder() {
  const ladder = ladderUnderPlayer();

  if (!ladder) {
    onLadder = false;
    return false;
  }

  // Anhängen, sobald hoch oder runter gedrückt wird
  if (!onLadder && (keys.up || keys.down)) {
    onLadder = true;
    player.vx = 0;
    player.vy = 0;
  }
  if (!onLadder) return false;

  // Seitwärts steigt man wieder ab
  if (keys.left || keys.right) {
    onLadder = false;
    return false;
  }

  player.vy = 0;
  if (keys.up) player.y -= CLIMB_SPEED;
  if (keys.down) player.y += CLIMB_SPEED;

  // Oben angekommen: loslassen, damit man auf den Absatz treten kann
  if (player.y + player.h <= ladder.y) {
    player.y = ladder.y - player.h;
    onLadder = false;
    return false;
  }
  // Unten angekommen
  if (player.y + player.h >= ladder.y + ladder.h) {
    player.y = ladder.y + ladder.h - player.h;
    onLadder = false;
    return false;
  }

  player.vx = 0;
  player.onGround = true; // an der Leiter fällt man nicht
  return true;
}

// ─── Klebeschuhe & Schwerkraft-Umkehr ──────────────────────

// Gegenstände einsammeln
function updateItems() {
  const pb = player.getBounds();
  for (const it of items) {
    if (it.taken) continue;
    if (
      pb.x < it.x + 26 &&
      pb.x + pb.w > it.x - 26 &&
      pb.y < it.y + 26 &&
      pb.y + pb.h > it.y - 26
    ) {
      it.taken = true;
      if (it.type === "stickyshoes") {
        hasStickyShoes = true;
        score += 50;
        addFloatText(it.x, it.y - 12, "Klebeschuhe!");
        audio.playPowerUp();
      }
    }
  }
}

// ─── Farbsteine ────────────────────────────────────────────
// Die Steine bleiben liegen – Punkte gibt es nur beim ersten Mal,
// die Farbe kann man beliebig oft wechseln.
function updateColorStones() {
  const pb = player.getBounds();
  for (const s of colorStones) {
    const near =
      pb.x < s.x + 22 &&
      pb.x + pb.w > s.x - 22 &&
      pb.y < s.y + 22 &&
      pb.y + pb.h > s.y - 22;
    if (!near) continue;

    const rgb = STONE_COLORS[s.color];
    if (!rgb) continue;

    // Nur reagieren, wenn die Farbe wirklich wechselt
    if (!tint || tint.name !== s.color) {
      tint = { name: s.color, r: 255, g: 255, b: 255, target: rgb };
      audio.playCoin();
      addFloatText(s.x, s.y - 16, s.color.toUpperCase());
    }
    if (!s.used) {
      s.used = true;
      score += 15;
    }
  }

  // Farbe weich überblenden
  if (tint) {
    tint.r += (tint.target[0] - tint.r) * 0.08;
    tint.g += (tint.target[1] - tint.g) * 0.08;
    tint.b += (tint.target[2] - tint.b) * 0.08;
  }
}

// Ist der Spieler im Bereich, in dem die Decke begehbar ist?
function inGravityZone() {
  const zones = level.gravityZones;
  if (!zones || !zones.length) return false;
  const cx = player.x + player.w / 2;
  return zones.some((z) => cx > z.x && cx < z.x + z.w);
}

function setGravitySign(sign) {
  if (sign === gravitySign) return;
  gravitySign = sign;
  player.onGround = false;
  audio.playBounce();
  addFloatText(
    player.x + player.w / 2,
    player.y + player.h / 2,
    sign === -1 ? "Klebeschuhe halten!" : "und wieder runter!",
  );
}

// Kopfüber endet, sobald man den Deckenbereich seitlich verlässt –
// dann fällt man herunter und dreht sich zurück.
function updateGravityZones() {
  if (gravitySign === -1 && !inGravityZone()) setGravitySign(1);

  // Drehung weich nachziehen
  const target = gravitySign === -1 ? Math.PI : 0;
  const diff = target - flipAngle;
  flipAngle += Math.abs(diff) < 0.02 ? diff : Math.sign(diff) * (Math.PI / 20);
}

// Feststehende Steinzacken
function updateHazards() {
  if (hitTimer > 0) return;
  const pb = player.getBounds();
  for (const h of hazards) {
    const hy = h.dir === "down" ? h.y : h.y - h.h;
    if (
      pb.x < h.x + h.w &&
      pb.x + pb.w > h.x &&
      pb.y < hy + h.h &&
      pb.y + pb.h > hy
    ) {
      hitPlayer(player.x + player.w / 2 < h.x + h.w / 2 ? -1 : 1);
      return;
    }
  }
}

// ─── Fallende Eiszapfen ────────────────────────────────────
function updateSpikes() {
  for (const s of spikes) {
    if (s.state === "hang") {
      s.timer--;
      if (s.timer <= 0) {
        s.state = "fall";
        s.vy = 0;
      }
    } else if (s.state === "fall") {
      s.vy += 0.45;
      s.y += s.vy;
      if (s.y + s.h >= s.floorY) {
        s.y = s.floorY - s.h;
        s.state = "broken";
        s.timer = 30;
      }
    } else if (s.state === "broken") {
      s.timer--;
      if (s.timer <= 0) {
        s.state = "hang";
        s.y = s.y0;
        s.vy = 0;
        s.timer = s.cycle;
      }
    }

    // Treffer nur während des Falls
    if (s.state !== "fall") continue;
    const pb = player.getBounds();
    if (
      pb.x < s.x + s.w / 2 &&
      pb.x + pb.w > s.x - s.w / 2 &&
      pb.y < s.y + s.h &&
      pb.y + pb.h > s.y
    ) {
      if (invincible) {
        audio.playBounce();
      } else if (level.enemyMode === "hit") {
        hitPlayer(player.x + player.w / 2 < s.x ? -1 : 1);
      } else {
        damagePlayer(player.x + player.w / 2 < s.x ? -1 : 1);
      }
      s.state = "broken";
      s.timer = 30;
      s.y = s.floorY - s.h;
    }
  }
}

// ─── Gegner-KI & Kick-Erkennung ────────────────────────────
function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    if (e.state === "dead") {
      enemies.splice(i, 1);
      continue;
    }

    if (e.state === "knocked") {
      e.knockTimer--;
      e.vy += DEFAULT_GRAVITY; // Schwerkraft beim Wegfliegen
      e.x += e.vx;
      e.y += e.vy;
      if (e.knockTimer <= 0) e.state = "dead";
      continue;
    }

    if (e.shieldFlash > 0) e.shieldFlash--;

    // Pflanze und Drache: laufen nicht, sondern schnappen im Takt
    if (e.kind === "plant" || e.kind === "dragon") {
      e.snapTimer++;
      const phase = e.snapTimer % e.snapCycle;
      // Die letzten 34 Frames des Takts wird geschnappt
      const snapStart = e.snapCycle - 34;
      e.snapping = phase >= snapStart;
      e.snapProgress = e.snapping
        ? Math.sin(((phase - snapStart) / 34) * Math.PI)
        : 0;

      // Nur das aufgerissene Maul tut weh
      if (e.snapping && e.snapProgress > 0.35) {
        const pbp = player.getBounds();
        if (
          pbp.x < e.x + e.w &&
          pbp.x + pbp.w > e.x &&
          pbp.y < e.y + e.h &&
          pbp.y + pbp.h > e.y
        ) {
          hitPlayer(player.x + player.w / 2 < e.x + e.w / 2 ? -1 : 1);
        }
      }
      continue;
    }

    // Patrol: hin- und herlaufen innerhalb der Plattform-Grenzen
    e.x += e.vx;
    if (e.x <= e.patrolLeft) {
      e.x = e.patrolLeft;
      e.vx = Math.abs(e.speed);
      e.facing = 1;
    } else if (e.x + e.w >= e.patrolRight) {
      e.x = e.patrolRight - e.w;
      e.vx = -Math.abs(e.speed);
      e.facing = -1;
    }

    const pb = player.getBounds();
    const overlapX = pb.x < e.x + e.w && pb.x + pb.w > e.x;
    const touches =
      overlapX && pb.y < e.y + e.h && pb.y + pb.h > e.y;

    // ── Schadens-Modus (Zahlenland): Gegner müssen übersprungen werden
    if (level.enemyMode === "damage") {
      // Bonus fürs saubere Überspringen – einmal pro Gegner
      if (overlapX && !e.jumpedOver && pb.y + pb.h <= e.y + 4) {
        e.jumpedOver = true;
        score += 15;
        addFloatText(e.x + e.w / 2, e.y - 18, "+15");
      }
      if (touches) {
        if (invincible) {
          if (player.kickTimer <= 0) kickEnemy(e);
        } else {
          damagePlayer(player.x + player.w / 2 < e.x + e.w / 2 ? -1 : 1);
        }
      }
      continue;
    }

    // ── Treffer-Modus (Steinzeit): zurückstoßen statt kicken
    if (level.enemyMode === "hit") {
      if (touches) hitPlayer(player.x + player.w / 2 < e.x + e.w / 2 ? -1 : 1);
      continue;
    }

    // ── Standard: automatischer Roundhouse-Kick
    if (player.kickTimer <= 0 && touches) {
      kickEnemy(e);
    }
  }
}

// ─── Update ────────────────────────────────────────────────
function update(dt) {
  if (gameState !== "playing") return;
  if (learnSystem.isShowing) return; // Pause bei Lernkarte

  // An der Leiter übernimmt das Klettern die Bewegung
  const climbing = level.ladders ? updateLadder() : false;
  if (level.ladders) ui.setClimbVisible(!!ladderUnderPlayer());

  // Bewegung
  if (!climbing) applyMovement(player, keys);

  // Pfeil und Bogen (Steinzeit)
  if (shootCooldown > 0) shootCooldown--;
  if (level.bow && keys.shoot && shootCooldown <= 0 && arrows.length < 12) {
    shootArrow();
  }
  updateArrows();

  // Klebeschuhe, Farbsteine & Schwerkraft-Umkehr (Steinzeit)
  updateItems();
  updateColorStones();
  updateGravityZones();
  player.gravitySign = gravitySign;

  // Sprung – kopfüber springt man nach unten
  if (keys.jump && player.onGround) {
    player.vy = JUMP_FORCE * gravitySign;
    player.onGround = false;
    learnSystem.checkEventTriggers("jump");
    if (learnSystem.isShowing) {
      audio.pauseMusic();
      learnSystem.onDismiss = () => audio.resumeMusic();
    }
    audio.playJump();
  }

  // Physik
  // Level-spezifische Schwerkraft (z.B. Mond/Space)
  const baseGravity =
    level.gravity !== undefined ? level.gravity : DEFAULT_GRAVITY;
  const surface = getCurrentSurface(player, level.platforms);
  if (!climbing) {
    applyGravity(player, baseGravity * gravitySign);
    applyFriction(player, surface);
    applyPosition(player);
  }

  // Kollisionen – an der Leiter steckt man sonst im Dachschacht fest
  const events = climbing ? [] : resolveCollisions(player, level.platforms);
  for (const evt of events) {
    // Mit Klebeschuhen hängt man sich an die Höhlendecke, sobald
    // man mit dem Kopf drankommt
    if (
      evt.type === "head_hit" &&
      hasStickyShoes &&
      evt.platform.ceiling &&
      gravitySign === 1 &&
      inGravityZone()
    ) {
      setGravitySign(-1);
    }
    learnSystem.checkEventTriggers(evt.type);
    if (learnSystem.isShowing) {
      audio.pauseMusic();
      learnSystem.onDismiss = () => audio.resumeMusic();
    }
    if (evt.type === "bounce") audio.playBounce();
  }

  // Stickman Animation
  player.update(keys, dt);

  // Gegner aktualisieren & Kick-Kollision prüfen
  updateEnemies();

  // Zahlen-Modus: Eiszapfen, Timer & Schwebetexte
  updateSpikes();
  updateHazards();
  if (hitTimer > 0) hitTimer--;
  if (specialAnimTimer > 0) specialAnimTimer--;
  updateFloatTexts();

  // Kamera (Spieler zentrieren, mit Rand)
  const targetCam = player.x - GAME_W / 3;
  camera += (targetCam - camera) * 0.08;
  camera = Math.max(0, Math.min(camera, level.worldWidth - GAME_W));

  // Vertikale Kamera (Turm & Space-Level mit Ziel-Fokus)
  if (level.worldTop !== undefined) {
    let targetCamY;
    // Space-Level: Kamera fährt nach unten, wenn Spieler in Zielnähe
    if (level.theme === "space" && player.y > 220) {
      targetCamY = 0; // Fokus auf Boden/Ziel
    } else {
      // Kopfüber schaut man nach unten, also Figur höher ins Bild setzen
      targetCamY = player.y - GAME_H * (gravitySign === -1 ? 0.3 : 0.65);
    }
    cameraY += (targetCamY - cameraY) * 0.08;
    cameraY = Math.max(level.worldTop, Math.min(0, cameraY));
  }

  // Coins einsammeln
  for (const coin of level.coins) {
    if (coin.collected) continue;
    const dx = player.x + player.w / 2 - coin.x;
    const dy = player.y + player.h / 2 - coin.y;
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      coin.collected = true;
      coin.collectTime = Date.now();
      score += 10;

      // Zahlen-Modus: Die Münze lässt die Zahl wachsen
      if (level.numberMode && playerNumber < 10) {
        playerNumber++;
        addFloatText(coin.x, coin.y - 8, `= ${playerNumber}`);
        audio.playNumberUp(playerNumber);
        // Volle Punktzahl → Spezial-Animation + Unbesiegbarkeit
        if (playerNumber >= 10) {
          invincible = true;
          specialAnimTimer = 150;
          audio.playPowerUp();
        }
      } else {
        audio.playCoin();
      }
    }
  }

  // Lern-Trigger prüfen
  for (const trigger of level.learnTriggers) {
    if (trigger.triggered) continue;
    const pb = player.getBounds();
    if (
      pb.x < trigger.x + trigger.w &&
      pb.x + pb.w > trigger.x &&
      pb.y < trigger.y + trigger.h &&
      pb.y + pb.h > trigger.y
    ) {
      trigger.triggered = true;
      learnSystem.triggerFact(trigger.factId, () => {
        audio.resumeMusic();
      });
      if (learnSystem.isShowing) audio.pauseMusic();
    }
  }

  // Ziel erreicht?
  const goal = level.goal;
  const pb = player.getBounds();
  if (
    pb.x < goal.x + goal.w &&
    pb.x + pb.w > goal.x &&
    pb.y < goal.y + goal.h &&
    pb.y + pb.h > goal.y
  ) {
    gameState = "levelComplete";

    // Steinzeit: Platz auf dem Siegertreppchen bestimmen
    if (level.podium) {
      const earned = score - levelStartScore;
      // Alles, was in diesem Level Punkte gibt – sonst käme man
      // über 100 % und jeder Durchlauf wäre ein erster Platz
      const maxPoints =
        (level.coins?.length || 0) * 10 +
        (level.items?.length || 0) * 50 +
        (level.enemies || []).filter((e) => !e.arrowProof).length * 20 +
        (level.colorStones?.length || 0) * 15 +
        (level.learnTriggers?.length || 0) * 25;
      const quote = maxPoints > 0 ? earned / maxPoints : 0;
      if (quote >= 0.9 && hits === 0) placement = 1;
      else if (quote >= 0.6) placement = 2;
      else placement = 3;
      score += [0, 300, 150, 50][placement];
    }

    score += 100;
    // Zahlen-Modus: Je höher die Zahl, desto mehr Punkte
    if (level.numberMode) {
      score += playerNumber * 50;
      if (playerNumber >= 10) score += 500;
    }
    levelCompleteTimer = 0;
    audio.stopMusic();
    audio.playLevelComplete();
    // Kamera nur im Space-Level zurücksetzen
    if (level.theme === "space") {
      cameraY = 0;
    }
    // Höchstes freigeschaltetes Level aktualisieren
    if (currentLevelId + 1 > maxLevelUnlocked) {
      maxLevelUnlocked = currentLevelId + 1;
    }
    saveProgress();
  }

  // Spieler fällt aus der Welt – kopfüber fällt er nach oben hinaus
  const fellOut =
    gravitySign === -1
      ? level.worldTop !== undefined &&
        player.y + player.h < level.worldTop - 20
      : player.y > GAME_H + 50;
  if (fellOut) {
    gameState = "gameOver";
    audio.stopMusic();
    audio.playGameOver();
  }
}

// ─── Render ────────────────────────────────────────────────
function render() {
  // HiDPI: Kontext skalieren, damit 800×400 auf tatsächliche Pixel abgebildet wird
  const sx = canvas.width / GAME_W;
  const sy = canvas.height / GAME_H;
  ctx.setTransform(sx, 0, 0, sy, 0, 0);

  ctx.clearRect(0, 0, GAME_W, GAME_H);

  if (gameState === "menu") {
    drawMenu();
    return;
  }

  if (gameState === "levelSelect") {
    drawLevelSelect();
    return;
  }

  if (gameState === "gameOver") {
    drawGameOver();
    return;
  }

  // Hintergrund
  ui.drawBackground(ctx, camera, level.theme, level);

  // Level-Elemente
  ctx.save();
  ctx.translate(0, -cameraY);
  ui.drawPlatforms(ctx, level.platforms, camera);
  ui.drawCoins(ctx, level.coins, camera);
  ui.drawLearnTriggers(ctx, level.learnTriggers, camera);
  ui.drawCastle(ctx, level.castle, camera);
  ui.drawLadders(ctx, level.ladders, camera);
  ui.drawGoal(ctx, level.goal, camera, level.theme);
  ui.drawSpikes(ctx, spikes, camera, level.theme);
  ui.drawHazards(ctx, hazards, camera);
  ui.drawItems(ctx, items, camera);
  ui.drawColorStones(ctx, colorStones, camera, STONE_COLORS);
  ui.drawArrows(ctx, arrows, camera);
  ui.drawEnemies(ctx, enemies, camera, level.theme);

  // Stickman zeichnen (relativ zur Kamera)
  ctx.save();
  ctx.translate(-camera, 0);
  if (level.theme === "walle") {
    player.drawWallE(ctx);
  } else if (level.theme === "minecraft") {
    player.drawSteve(ctx);
  } else if (level.theme === "space") {
    player.drawSpace(ctx);
  } else if (level.theme === "ninjago") {
    player.drawNinja(ctx);
  } else if (level.theme === "clockwork") {
    player.drawEngineer(ctx);
  } else if (level.theme === "skatepark") {
    player.drawSkater(ctx);
  } else if (level.theme === "numbers") {
    player.drawNumber(ctx, playerNumber, invincible, hitTimer);
  } else if (level.theme === "stoneage") {
    // Nach einem Treffer blinkt der Höhlenmensch
    if (hitTimer <= 0 || Math.floor(hitTimer / 6) % 2 === 0) {
      player.drawCaveman(ctx, flipAngle, hasStickyShoes);
    }
  } else {
    player.draw(ctx);
  }
  ctx.restore();

  // Schwebende Punkte-Texte
  drawFloatTexts();

  // Spezial-Animation bei voller Punktzahl
  if (specialAnimTimer > 0) drawSpecialAnim();

  ctx.restore(); // cameraY-Verschiebung beenden

  // Levelfarbe der Farbsteine über die Szene legen – vor dem HUD,
  // damit Punktestand und Lernkarten unverfälscht bleiben
  ui.applyTint(ctx, tint);

  // HUD
  ui.updateHUD(score, `Level ${level.id}: ${level.name}`);
  ui.drawPhysicsInfo(ctx, player);
  if (level.numberMode) ui.drawNumberHUD(ctx, playerNumber, invincible);

  // Level Complete Overlay
  if (gameState === "levelComplete") {
    // Transformation zurücksetzen und wieder auf HiDPI skalieren
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sx = canvas.width / GAME_W;
    const sy = canvas.height / GAME_H;
    ctx.scale(sx, sy);
    drawLevelComplete();
  }
}

// Schwebende "+15" / "−1" / "= 4" Texte (Weltkoordinaten)
function drawFloatTexts() {
  if (floatTexts.length === 0) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 13px sans-serif";
  ctx.fillStyle = "#fff";
  for (const f of floatTexts) {
    ctx.globalAlpha = Math.min(1, f.life / 30);
    ctx.fillText(f.text, f.x - camera, f.y);
  }
  ctx.restore();
}

// Spezial-Animation: Ringe, Funken und "UNBESIEGBAR!"
function drawSpecialAnim() {
  const t = 1 - specialAnimTimer / 150;
  const cx = player.x + player.w / 2 - camera;
  const cy = player.y + player.h / 2;

  ctx.save();
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";

  // Expandierende Ringe
  for (let i = 0; i < 3; i++) {
    const rt = (t + i * 0.33) % 1;
    ctx.globalAlpha = Math.max(0, 1 - rt) * 0.9;
    ctx.lineWidth = Math.max(0.5, 3 - rt * 2);
    ctx.beginPath();
    ctx.arc(cx, cy, 10 + rt * 90, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Funken
  ctx.globalAlpha = Math.max(0, 1 - t);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + t * 2;
    const d = 20 + t * 70;
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(a) * d,
      cy + Math.sin(a) * d,
      Math.max(0.5, 2.5 - t * 2),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Text
  ctx.globalAlpha = Math.min(1, (1 - t) * 2);
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("UNBESIEGBAR!", cx, cy - 70);
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("volle Punktzahl: 10", cx, cy - 54);

  ctx.restore();
}

function drawMenu() {
  // Hintergrund
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Titel
  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Stickman Physics", GAME_W / 2, 120);

  // Untertitel
  ctx.fillStyle = "#888";
  ctx.font = "16px sans-serif";
  ctx.fillText("Lerne Physik durch Spielen!", GAME_W / 2, 160);

  // Stickman Vorschau
  const demoStick = new Stickman(GAME_W / 2 - 12, 200);
  demoStick.draw(ctx);

  // Start-Hinweis
  const blink = Math.sin(Date.now() / 500) > 0;
  if (blink) {
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText("Drücke ENTER oder tippe zum Starten", GAME_W / 2, 310);
  }

  // Steuerung
  ctx.fillStyle = "#555";
  ctx.font = "13px sans-serif";
  ctx.fillText(
    "← → Laufen  |  ↑ / Leertaste Springen  |  R = Neustart",
    GAME_W / 2,
    350,
  );
  ctx.fillText(`Level ${currentLevelId}  |  Score: ${score}`, GAME_W / 2, 370);

  // Level-Auswahl Hinweis
  ctx.fillStyle = "#888";
  ctx.font = "14px sans-serif";
  ctx.fillText("L = Level auswählen", GAME_W / 2, 395);
}

function drawGameOver() {
  // Hintergrund
  ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Gefallen!", GAME_W / 2, 160);

  ctx.fillStyle = "#888";
  ctx.font = "16px sans-serif";
  ctx.fillText("Versuch es nochmal!", GAME_W / 2, 210);

  const blink = Math.sin(Date.now() / 500) > 0;
  if (blink) {
    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.fillText("Drücke ENTER oder tippe zum Neustarten", GAME_W / 2, 280);
  }

  ctx.fillStyle = "#555";
  ctx.font = "13px sans-serif";
  ctx.fillText("R = Zurück zum Anfang", GAME_W / 2, 330);
}

function drawLevelComplete() {
  levelCompleteTimer++;

  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Overlay immer mittig im Canvas anzeigen (ohne Kamera-Offset)
  let overlayY = 0;

  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Level geschafft!", GAME_W / 2, 150 + overlayY);

  ctx.fillStyle = "#fff";
  ctx.font = "18px sans-serif";
  ctx.fillText(`+100 Punkte  |  Score: ${score}`, GAME_W / 2, 200 + overlayY);

  // Gelernte Fakten
  ctx.fillStyle = "#888";
  ctx.font = "14px sans-serif";
  ctx.fillText(
    `${learnSystem.getLearnedCount()} Physik-Fakten gelernt`,
    GAME_W / 2,
    240 + overlayY,
  );

  // Steinzeit: Platz auf dem Siegertreppchen
  if (level && level.podium && placement) {
    const medal = ["", "🥇", "🥈", "🥉"][placement];
    ctx.fillStyle = "#fff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`${medal}  ${placement}. PLATZ`, GAME_W / 2, 272 + overlayY);

    ctx.globalAlpha = 0.65;
    ctx.font = "12px sans-serif";
    const tip =
      placement === 1
        ? "Perfekt – mehr geht nicht!"
        : placement === 2
          ? hits > 0
            ? `Für Platz 1: alles einsammeln und ohne Treffer durch (${hits} kassiert)`
            : "Für Platz 1: noch mehr einsammeln"
          : "Für Platz 2: mehr als die Hälfte einsammeln";
    ctx.fillText(tip, GAME_W / 2, 292 + overlayY);
    ctx.globalAlpha = 1;
  }

  // Zahlen-Modus: Zahl-Bonus anzeigen
  if (level && level.numberMode) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(
      `Deine Zahl: ${playerNumber}  →  +${playerNumber * 50} Bonus`,
      GAME_W / 2,
      266 + overlayY,
    );
    if (playerNumber >= 10) {
      const blink = Math.sin(Date.now() / 200) * 0.35 + 0.65;
      ctx.globalAlpha = blink;
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("PERFEKT! 10 / 10  ·  +500", GAME_W / 2, 286 + overlayY);
      ctx.globalAlpha = 1;
    }
  }

  // Auto-Weiter nach ~3 Sekunden
  if (levelCompleteTimer > 180) {
    const nextId = currentLevelId + 1;
    if (nextId <= getTotalLevels()) {
      currentLevelId = nextId;
      saveProgress();
      startLevel(nextId);
    } else {
      // Alle Levels geschafft
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(
        "Alle Levels geschafft! Du bist ein Physik-Profi!",
        GAME_W / 2,
        300 + overlayY,
      );
    }
  } else {
    ctx.fillStyle = "#555";
    ctx.font = "13px sans-serif";
    ctx.fillText(
      "Nächstes Level startet gleich...",
      GAME_W / 2,
      300 + overlayY,
    );
  }
}

// ─── Game Loop ─────────────────────────────────────────────
function gameLoop(timestamp) {
  const dt = lastTime ? timestamp - lastTime : 16;
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// ─── Start ─────────────────────────────────────────────────
loadProgress();
requestAnimationFrame(gameLoop);
