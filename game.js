// game.js – Haupt-Game-Loop, bringt alle Module zusammen

import { Stickman } from './modules/stickman.js';
import {
  applyGravity, applyMovement, applyFriction, applyPosition,
  resolveCollisions, getCurrentSurface, JUMP_FORCE
} from './modules/physics.js';
import { loadLevel, getTotalLevels } from './modules/level.js';
import { LearnSystem } from './modules/learn.js';
import { UI, setupTouchControls } from './modules/ui.js';

// ─── Canvas Setup ──────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ─── Game State ────────────────────────────────────────────
const keys = { left: false, right: false, jump: false };
let currentLevelId = 1;
let level = null;
let player = null;
let camera = 0;
let score = 0;
let gameState = 'menu'; // menu, playing, levelComplete, gameOver
let lastTime = 0;
let levelCompleteTimer = 0;

// ─── Systeme ───────────────────────────────────────────────
const ui = new UI(canvas);
const learnSystem = new LearnSystem();

// ─── Save / Load ───────────────────────────────────────────
function saveProgress() {
  const data = {
    level: currentLevelId,
    score: score,
    factsLearned: [...learnSystem.shownFacts],
  };
  try {
    localStorage.setItem('stickmanSave', JSON.stringify(data));
  } catch {
    // localStorage nicht verfügbar, ignorieren
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('stickmanSave');
    if (raw) {
      const data = JSON.parse(raw);
      currentLevelId = data.level || 1;
      score = data.score || 0;
      if (data.factsLearned) {
        data.factsLearned.forEach(f => learnSystem.shownFacts.add(f));
      }
    }
  } catch {
    // Fehler beim Laden ignorieren
  }
}

// ─── Level laden ───────────────────────────────────────────
function startLevel(id) {
  level = loadLevel(id);
  if (!level) {
    // Alle Levels geschafft!
    gameState = 'menu';
    return;
  }
  currentLevelId = id;
  player = new Stickman(level.spawnX, level.spawnY);
  camera = 0;
  gameState = 'playing';
  levelCompleteTimer = 0;
}

function resetAll() {
  currentLevelId = 1;
  score = 0;
  learnSystem.reset();
  try {
    localStorage.removeItem('stickmanSave');
  } catch {
    // ignorieren
  }
  gameState = 'menu';
}

// ─── Input ─────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    keys.jump = true;
  }
  // Menü: Enter zum Starten
  if (e.code === 'Enter' || e.code === 'Space') {
    if (gameState === 'menu') {
      startLevel(currentLevelId);
    } else if (gameState === 'gameOver') {
      startLevel(currentLevelId);
    }
  }
  // R = Kompletter Neustart
  if (e.code === 'KeyR') {
    resetAll();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.jump = false;
});

// Touch-Start für Menü
canvas.addEventListener('click', () => {
  if (gameState === 'menu' || gameState === 'gameOver') {
    startLevel(currentLevelId);
  }
});

setupTouchControls(keys);

// Touch Reset-Button
document.getElementById('btn-reset').addEventListener('click', () => {
  resetAll();
});

// ─── Update ────────────────────────────────────────────────
function update(dt) {
  if (gameState !== 'playing') return;
  if (learnSystem.isShowing) return; // Pause bei Lernkarte

  // Bewegung
  applyMovement(player, keys);

  // Sprung
  if (keys.jump && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    learnSystem.checkEventTriggers('jump');
  }

  // Physik
  applyGravity(player);
  const surface = getCurrentSurface(player, level.platforms);
  applyFriction(player, surface);
  applyPosition(player);

  // Kollisionen
  const events = resolveCollisions(player, level.platforms);
  for (const evt of events) {
    learnSystem.checkEventTriggers(evt.type);
  }

  // Stickman Animation
  player.update(keys, dt);

  // Kamera (Spieler zentrieren, mit Rand)
  const targetCam = player.x - canvas.width / 3;
  camera += (targetCam - camera) * 0.08;
  camera = Math.max(0, Math.min(camera, level.worldWidth - canvas.width));

  // Coins einsammeln
  for (const coin of level.coins) {
    if (coin.collected) continue;
    const dx = (player.x + player.w / 2) - coin.x;
    const dy = (player.y + player.h / 2) - coin.y;
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      coin.collected = true;
      score += 10;
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
      learnSystem.triggerFact(trigger.factId);
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
    gameState = 'levelComplete';
    score += 100;
    levelCompleteTimer = 0;
    saveProgress();
  }

  // Spieler fällt aus der Welt
  if (player.y > canvas.height + 50) {
    gameState = 'gameOver';
  }
}

// ─── Render ────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'menu') {
    drawMenu();
    return;
  }

  if (gameState === 'gameOver') {
    drawGameOver();
    return;
  }

  // Hintergrund
  ui.drawBackground(ctx, camera, level.theme);

  // Level-Elemente
  ctx.save();
  ui.drawPlatforms(ctx, level.platforms, camera);
  ui.drawCoins(ctx, level.coins, camera);
  ui.drawLearnTriggers(ctx, level.learnTriggers, camera);
  ui.drawGoal(ctx, level.goal, camera);

  // Stickman zeichnen (relativ zur Kamera)
  ctx.save();
  ctx.translate(-camera, 0);
  player.draw(ctx);
  ctx.restore();

  ctx.restore();

  // HUD
  ui.updateHUD(score, `Level ${level.id}: ${level.name}`);
  ui.drawPhysicsInfo(ctx, player);

  // Level Complete Overlay
  if (gameState === 'levelComplete') {
    drawLevelComplete();
  }
}

function drawMenu() {
  // Hintergrund
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Titel
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Stickman Physics', canvas.width / 2, 120);

  // Untertitel
  ctx.fillStyle = '#888';
  ctx.font = '16px sans-serif';
  ctx.fillText('Lerne Physik durch Spielen!', canvas.width / 2, 160);

  // Stickman Vorschau
  const demoStick = new Stickman(canvas.width / 2 - 12, 200);
  demoStick.draw(ctx);

  // Start-Hinweis
  const blink = Math.sin(Date.now() / 500) > 0;
  if (blink) {
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Drücke ENTER oder tippe zum Starten', canvas.width / 2, 310);
  }

  // Steuerung
  ctx.fillStyle = '#555';
  ctx.font = '13px sans-serif';
  ctx.fillText('← → Laufen  |  ↑ / Leertaste Springen  |  R = Neustart', canvas.width / 2, 360);
  ctx.fillText(`Level ${currentLevelId}  |  Score: ${score}`, canvas.width / 2, 385);
}

function drawGameOver() {
  // Hintergrund
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Gefallen!', canvas.width / 2, 160);

  ctx.fillStyle = '#888';
  ctx.font = '16px sans-serif';
  ctx.fillText('Versuch es nochmal!', canvas.width / 2, 210);

  const blink = Math.sin(Date.now() / 500) > 0;
  if (blink) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Drücke ENTER oder tippe zum Neustarten', canvas.width / 2, 280);
  }

  ctx.fillStyle = '#555';
  ctx.font = '13px sans-serif';
  ctx.fillText('R = Zurück zum Anfang', canvas.width / 2, 330);
}

function drawLevelComplete() {
  levelCompleteTimer++;

  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Level geschafft!', canvas.width / 2, 150);

  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText(`+100 Punkte  |  Score: ${score}`, canvas.width / 2, 200);

  // Gelernte Fakten
  ctx.fillStyle = '#888';
  ctx.font = '14px sans-serif';
  ctx.fillText(`${learnSystem.getLearnedCount()} Physik-Fakten gelernt`, canvas.width / 2, 240);

  // Auto-Weiter nach ~3 Sekunden
  if (levelCompleteTimer > 180) {
    const nextId = currentLevelId + 1;
    if (nextId <= getTotalLevels()) {
      currentLevelId = nextId;
      saveProgress();
      startLevel(nextId);
    } else {
      // Alle Levels geschafft
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Alle Levels geschafft! Du bist ein Physik-Profi!', canvas.width / 2, 300);
    }
  } else {
    ctx.fillStyle = '#555';
    ctx.font = '13px sans-serif';
    ctx.fillText('Nächstes Level startet gleich...', canvas.width / 2, 300);
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
