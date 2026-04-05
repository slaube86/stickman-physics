// ui.js – HUD, Rendering-Hilfen, Touch Controls

export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.scoreDisplay = document.getElementById('score-display');
    this.levelDisplay = document.getElementById('level-display');
  }

  updateHUD(score, levelName) {
    this.scoreDisplay.textContent = `Score: ${score}`;
    this.levelDisplay.textContent = levelName;
  }

  // Hintergrund zeichnen – rein schwarz
  drawBackground(ctx, camera, theme) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Plattformen zeichnen – nur dünne weiße Linien
  drawPlatforms(ctx, platforms, camera) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;

    for (const p of platforms) {
      const x = p.x - camera;
      const y = p.y;

      // Außerhalb des Sichtfelds? Überspringen
      if (x + p.w < -50 || x > this.canvas.width + 50) continue;

      // Oberkante als Hauptlinie
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + p.w, y);
      ctx.stroke();

      // Bei speziellen Oberflächen: Markierung
      if (p.surface === 'ice') {
        // Gestrichelte Linie darunter
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x + p.w, y + 4);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (p.surface === 'sand') {
        // Gepunktete Linie darunter
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x + p.w, y + 4);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (p.surface === 'trampolin') {
        // Zickzack-Linie
        ctx.beginPath();
        for (let fx = x; fx < x + p.w; fx += 8) {
          ctx.lineTo(fx, y + ((fx / 8) % 2 === 0 ? 3 : 7));
        }
        ctx.stroke();
      }
    }
  }

  // Coins zeichnen – kleine weiße Kreise
  drawCoins(ctx, coins, camera) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;

    for (const coin of coins) {
      if (coin.collected) continue;
      const x = coin.x - camera;
      if (x < -20 || x > this.canvas.width + 20) continue;

      ctx.beginPath();
      ctx.arc(x, coin.y, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Punkt in der Mitte
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, coin.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Lern-Trigger zeichnen – pulsierende weiße Fragezeichen
  drawLearnTriggers(ctx, triggers, camera) {
    for (const t of triggers) {
      if (t.triggered) continue;
      const x = t.x - camera + t.w / 2;
      if (x < -30 || x > this.canvas.width + 30) continue;

      const y = t.y + t.h / 2;
      const pulse = Math.sin(Date.now() / 300) * 3;

      // Kreis-Umriss
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 12 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Fragezeichen
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x, y);
    }
  }

  // Ziel zeichnen – einfache Flagge aus Linien
  drawGoal(ctx, goal, camera) {
    const x = goal.x - camera;
    if (x < -80 || x > this.canvas.width + 80) return;

    const pulse = Math.sin(Date.now() / 400) * 2;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;

    // Flaggenmast
    ctx.beginPath();
    ctx.moveTo(x + 25, goal.y + goal.h);
    ctx.lineTo(x + 25, goal.y - 40);
    ctx.stroke();

    // Fahne als Dreieck-Umriss
    ctx.beginPath();
    ctx.moveTo(x + 25, goal.y - 40 + pulse);
    ctx.lineTo(x + 50, goal.y - 30 + pulse);
    ctx.lineTo(x + 25, goal.y - 20 + pulse);
    ctx.closePath();
    ctx.stroke();

    // "ZIEL" Text
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ZIEL', x + 30, goal.y - 46 + pulse);
  }

  // Physik-Info Anzeige
  drawPhysicsInfo(ctx, player) {
    const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2).toFixed(1);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`v: ${speed} px/f`, this.canvas.width - 10, this.canvas.height - 10);
  }
}

// Touch-Controls Setup
export function setupTouchControls(keys) {
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnJump = document.getElementById('btn-jump');

  const press = (key) => { keys[key] = true; };
  const release = (key) => { keys[key] = false; };

  btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); press('left'); });
  btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); release('left'); });

  btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); press('right'); });
  btnRight.addEventListener('touchend', (e) => { e.preventDefault(); release('right'); });

  btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); press('jump'); });
  btnJump.addEventListener('touchend', (e) => { e.preventDefault(); release('jump'); });
}
