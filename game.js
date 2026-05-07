// game.js – Haupt-Game-Loop, bringt alle Module zusammen

import { Stickman } from "./modules/stickman.js?v=23";
import {
  applyGravity,
  applyMovement,
  applyFriction,
  applyPosition,
  resolveCollisions,
  getCurrentSurface,
  JUMP_FORCE,
  DEFAULT_GRAVITY,
} from "./modules/physics.js?v=23";
import { loadLevel, getTotalLevels } from "./modules/level.js?v=23";
import { LearnSystem } from "./modules/learn.js?v=23";
import { UI, setupTouchControls } from "./modules/ui.js?v=23";
import { AudioManager } from "./modules/audio.js?v=23";

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
const keys = { left: false, right: false, jump: false };
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

// ─── Systeme ───────────────────────────────────────────────
const ui = new UI(canvas);
const learnSystem = new LearnSystem();
const audio = new AudioManager();

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
  enemies = (level.enemies || []).map((e) => ({
    x: e.x,
    y: e.platformY - ENEMY_H,
    w: ENEMY_W,
    h: ENEMY_H,
    vx: e.speed || 1.2,
    speed: e.speed || 1.2,
    patrolLeft: e.patrolLeft,
    patrolRight: e.patrolRight,
    state: "patrol", // patrol | knocked | dead
    facing: 1,
    knockTimer: 0,
  }));
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

    // Kollision mit Spieler → automatischer Roundhouse-Kick!
    if (player.kickTimer <= 0) {
      const pb = player.getBounds();
      if (
        pb.x < e.x + e.w &&
        pb.x + pb.w > e.x &&
        pb.y < e.y + e.h &&
        pb.y + pb.h > e.y
      ) {
        // Kick-Animation starten
        player.kickTimer = 22;
        const dir = e.x + e.w / 2 > player.x + player.w / 2 ? 1 : -1;
        player.facing = dir;
        // Gegner wegschleudern
        e.state = "knocked";
        e.knockTimer = 50;
        e.vx = dir * 9;
        e.vy = -7;
        score += 20;
        audio.playBounce();
      }
    }
  }
}

// ─── Update ────────────────────────────────────────────────
function update(dt) {
  if (gameState !== "playing") return;
  if (learnSystem.isShowing) return; // Pause bei Lernkarte

  // Bewegung
  applyMovement(player, keys);

  // Sprung
  if (keys.jump && player.onGround) {
    player.vy = JUMP_FORCE;
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
  const gravity = level.gravity !== undefined ? level.gravity : undefined;
  applyGravity(player, gravity);
  const surface = getCurrentSurface(player, level.platforms);
  applyFriction(player, surface);
  applyPosition(player);

  // Kollisionen
  const events = resolveCollisions(player, level.platforms);
  for (const evt of events) {
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
      targetCamY = player.y - GAME_H * 0.65;
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
      audio.playCoin();
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
    score += 100;
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

  // Spieler fällt aus der Welt
  if (player.y > GAME_H + 50) {
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
  ui.drawGoal(ctx, level.goal, camera, level.theme);
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
  } else {
    player.draw(ctx);
  }
  ctx.restore();

  // HUD
  ui.updateHUD(score, `Level ${level.id}: ${level.name}`);
  ui.drawPhysicsInfo(ctx, player);

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
