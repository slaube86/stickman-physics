// game.js – Haupt-Game-Loop, bringt alle Module zusammen

import { Stickman } from './modules/stickman.js?v=9';
import {
  applyGravity, applyMovement, applyFriction, applyPosition,
  resolveCollisions, getCurrentSurface, JUMP_FORCE
} from './modules/physics.js?v=9';
import { loadLevel, getTotalLevels } from './modules/level.js?v=9';
import { LearnSystem } from './modules/learn.js?v=9';
import { UI, setupTouchControls } from './modules/ui.js?v=9';
import { AudioManager } from './modules/audio.js?v=9';

// ─── Canvas Setup ──────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Logische Spielfeldgröße (alle Koordinaten beziehen sich hierauf)
const GAME_W = 800;
const GAME_H = 400;

// HiDPI-Canvas: Auflösung an tatsächliche Pixeldichte anpassen
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── Game State ────────────────────────────────────────────
const keys = { left: false, right: false, jump: false };
let currentLevelId = 1;
let maxLevelUnlocked = 1;
let level = null;
let player = null;
let camera = 0;
let score = 0;
let gameState = 'menu'; // menu, playing, levelSelect, levelComplete, gameOver
let lastTime = 0;
let levelCompleteTimer = 0;

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
      maxLevelUnlocked = data.maxLevel || data.level || 1;
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
  audio.init(); // AudioContext bei erster Interaktion starten
  level = loadLevel(id);
  if (!level) {
    gameState = 'menu';
    audio.stopMusic();
    return;
  }
  currentLevelId = id;
  player = new Stickman(level.spawnX, level.spawnY);
  camera = 0;
  gameState = 'playing';
  levelCompleteTimer = 0;
  audio.startMusic(level.theme);
}

function resetAll() {
  currentLevelId = 1;
  score = 0;
  learnSystem.reset();
  saveProgress();
  audio.stopMusic();
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
  // L = Level-Auswahl
  if (e.code === 'KeyL') {
    if (gameState === 'menu' || gameState === 'playing') {
      gameState = 'levelSelect';
    }
  }
  // Escape = Zurück zum Menü
  if (e.code === 'Escape') {
    if (gameState === 'levelSelect') {
      gameState = 'menu';
    }
  }
  // Zahlen 1-9 in Level-Auswahl
  if (gameState === 'levelSelect') {
    const num = parseInt(e.key);
    if (num >= 1 && num <= maxLevelUnlocked && num <= getTotalLevels()) {
      startLevel(num);
    }
  }
  // R = Kompletter Neustart
  if (e.code === 'KeyR') {
    resetAll();
  }
  // M = Mute/Unmute
  if (e.code === 'KeyM') {
    audio.init();
    audio.toggleMute();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.jump = false;
});

// ─── Level-Select: Box-Positionen berechnen ───────────────
function getLevelBoxes() {
  const total = getTotalLevels();
  const boxW = 80;
  const boxH = 80;
  const gap = 20;
  const cols = Math.min(total, 4);
  const totalW = cols * boxW + (cols - 1) * gap;
  const startX = (GAME_W - totalW) / 2;
  const startY = 160;
  const boxes = [];
  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    boxes.push({
      id: i + 1,
      x: startX + col * (boxW + gap),
      y: startY + row * (boxH + gap),
      w: boxW,
      h: boxH,
    });
  }
  return boxes;
}

function drawLevelSelect() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Level auswählen', GAME_W / 2, 80);

  ctx.fillStyle = '#888';
  ctx.font = '14px sans-serif';
  ctx.fillText('Tippe auf ein Level oder drücke die Zahl', GAME_W / 2, 115);

  const boxes = getLevelBoxes();
  for (const box of boxes) {
    const unlocked = box.id <= maxLevelUnlocked;
    const completed = box.id < maxLevelUnlocked;

    // Box
    ctx.strokeStyle = unlocked ? '#fff' : '#444';
    ctx.lineWidth = unlocked ? 1.5 : 1;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    // Level-Nummer
    ctx.fillStyle = unlocked ? '#fff' : '#444';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(box.id, box.x + box.w / 2, box.y + 35);

    // Level-Name
    const lvlData = loadLevel(box.id);
    if (lvlData) {
      ctx.font = '11px sans-serif';
      ctx.fillText(lvlData.name, box.x + box.w / 2, box.y + 55);
    }

    // Haken bei abgeschlossenen Levels
    if (completed) {
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText('✓', box.x + box.w / 2, box.y + 75);
    }

    // Schloss bei gesperrten Levels
    if (!unlocked) {
      ctx.fillStyle = '#444';
      ctx.font = '16px sans-serif';
      ctx.fillText('🔒', box.x + box.w / 2, box.y + 75);
    }
  }

  ctx.fillStyle = '#555';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESC = Zurück', GAME_W / 2, GAME_H - 20);
}

// Touch/Klick auf Canvas
canvas.addEventListener('click', (e) => {
  if (gameState === 'levelSelect') {
    // Klick-Position relativ zum Canvas berechnen
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_W / rect.width;
    const scaleY = GAME_H / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const boxes = getLevelBoxes();
    for (const box of boxes) {
      if (
        clickX >= box.x && clickX <= box.x + box.w &&
        clickY >= box.y && clickY <= box.y + box.h &&
        box.id <= maxLevelUnlocked
      ) {
        startLevel(box.id);
        return;
      }
    }
    return;
  }

  if (gameState === 'menu' || gameState === 'gameOver') {
    startLevel(currentLevelId);
  }
});

setupTouchControls(keys);

// Touch Reset-Button
document.getElementById('btn-reset').addEventListener('click', () => {
  resetAll();
});

// Touch Level-Select Button
document.getElementById('btn-levels').addEventListener('click', () => {
  if (gameState === 'levelSelect') {
    gameState = 'menu';
  } else {
    gameState = 'levelSelect';
  }
});

// Mute-Button
const muteBtn = document.getElementById('btn-mute');
muteBtn.addEventListener('click', () => {
  audio.init();
  const muted = audio.toggleMute();
  muteBtn.textContent = muted ? '🔇' : '🔊';
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
    if (learnSystem.isShowing) {
      audio.pauseMusic();
      learnSystem.onDismiss = () => audio.resumeMusic();
    }
    audio.playJump();
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
    if (learnSystem.isShowing) {
      audio.pauseMusic();
      learnSystem.onDismiss = () => audio.resumeMusic();
    }
    if (evt.type === 'bounce') audio.playBounce();
  }

  // Stickman Animation
  player.update(keys, dt);

  // Kamera (Spieler zentrieren, mit Rand)
  const targetCam = player.x - GAME_W / 3;
  camera += (targetCam - camera) * 0.08;
  camera = Math.max(0, Math.min(camera, level.worldWidth - GAME_W));

  // Coins einsammeln
  for (const coin of level.coins) {
    if (coin.collected) continue;
    const dx = (player.x + player.w / 2) - coin.x;
    const dy = (player.y + player.h / 2) - coin.y;
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
    gameState = 'levelComplete';
    score += 100;
    levelCompleteTimer = 0;
    audio.stopMusic();
    audio.playLevelComplete();
    // Höchstes freigeschaltetes Level aktualisieren
    if (currentLevelId + 1 > maxLevelUnlocked) {
      maxLevelUnlocked = currentLevelId + 1;
    }
    saveProgress();
  }

  // Spieler fällt aus der Welt
  if (player.y > GAME_H + 50) {
    gameState = 'gameOver';
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

  if (gameState === 'menu') {
    drawMenu();
    return;
  }

  if (gameState === 'levelSelect') {
    drawLevelSelect();
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
  ui.drawGoal(ctx, level.goal, camera, level.theme);

  // Stickman zeichnen (relativ zur Kamera)
  ctx.save();
  ctx.translate(-camera, 0);
  if (level.theme === 'walle') {
    player.drawWallE(ctx);
  } else if (level.theme === 'minecraft') {
    player.drawSteve(ctx);
  } else {
    player.draw(ctx);
  }
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
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Titel
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Stickman Physics', GAME_W / 2, 120);

  // Untertitel
  ctx.fillStyle = '#888';
  ctx.font = '16px sans-serif';
  ctx.fillText('Lerne Physik durch Spielen!', GAME_W / 2, 160);

  // Stickman Vorschau
  const demoStick = new Stickman(GAME_W / 2 - 12, 200);
  demoStick.draw(ctx);

  // Start-Hinweis
  const blink = Math.sin(Date.now() / 500) > 0;
  if (blink) {
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Drücke ENTER oder tippe zum Starten', GAME_W / 2, 310);
  }

  // Steuerung
  ctx.fillStyle = '#555';
  ctx.font = '13px sans-serif';
  ctx.fillText('← → Laufen  |  ↑ / Leertaste Springen  |  R = Neustart', GAME_W / 2, 350);
  ctx.fillText(`Level ${currentLevelId}  |  Score: ${score}`, GAME_W / 2, 370);

  // Level-Auswahl Hinweis
  ctx.fillStyle = '#888';
  ctx.font = '14px sans-serif';
  ctx.fillText('L = Level auswählen', GAME_W / 2, 395);
}

function drawGameOver() {
  // Hintergrund
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Gefallen!', GAME_W / 2, 160);

  ctx.fillStyle = '#888';
  ctx.font = '16px sans-serif';
  ctx.fillText('Versuch es nochmal!', GAME_W / 2, 210);

  const blink = Math.sin(Date.now() / 500) > 0;
  if (blink) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Drücke ENTER oder tippe zum Neustarten', GAME_W / 2, 280);
  }

  ctx.fillStyle = '#555';
  ctx.font = '13px sans-serif';
  ctx.fillText('R = Zurück zum Anfang', GAME_W / 2, 330);
}

function drawLevelComplete() {
  levelCompleteTimer++;

  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Level geschafft!', GAME_W / 2, 150);

  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText(`+100 Punkte  |  Score: ${score}`, GAME_W / 2, 200);

  // Gelernte Fakten
  ctx.fillStyle = '#888';
  ctx.font = '14px sans-serif';
  ctx.fillText(`${learnSystem.getLearnedCount()} Physik-Fakten gelernt`, GAME_W / 2, 240);

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
      ctx.fillText('Alle Levels geschafft! Du bist ein Physik-Profi!', GAME_W / 2, 300);
    }
  } else {
    ctx.fillStyle = '#555';
    ctx.font = '13px sans-serif';
    ctx.fillText('Nächstes Level startet gleich...', GAME_W / 2, 300);
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
