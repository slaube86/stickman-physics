// ui.js – HUD, Rendering-Hilfen, Touch Controls

const GAME_W = 800;
const GAME_H = 400;

export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.scoreDisplay = document.getElementById("score-display");
    this.levelDisplay = document.getElementById("level-display");
  }

  updateHUD(score, levelName) {
    this.scoreDisplay.textContent = `Score: ${score}`;
    this.levelDisplay.textContent = levelName;
  }

  // Hintergrund zeichnen – Space: schwarz + zufällige Sterne
  drawBackground(ctx, camera, theme, level) {
    if (theme === "space") {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      // Sterne: einmalig pro Levelstart generieren
      if (!level._starField) {
        const count = (level.starField && level.starField.count) || 80;
        const minR = (level.starField && level.starField.minR) || 0.5;
        const maxR = (level.starField && level.starField.maxR) || 1.8;
        level._starField = Array.from({ length: count }, () => ({
          x: Math.random() * GAME_W,
          y: Math.random() * GAME_H,
          r: Math.random() * (maxR - minR) + minR,
          a: Math.random() * 0.5 + 0.5,
        }));
      }
      ctx.save();
      for (const star of level._starField) {
        ctx.globalAlpha = star.a;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
      ctx.restore();
    } else if (theme === "ninjago") {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Mondscheibe (statisch, dekorativ)
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(640, 72, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Pagoden-Silhouetten im Hintergrund (Parallax)
      const parallax = camera * 0.25;
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = "#fff";

      const drawPagodaSil = (px, baseY) => {
        const sx = px - parallax;
        if (sx < -160 || sx > GAME_W + 160) return;
        // Turm-Körper
        ctx.fillRect(sx - 10, baseY - 75, 20, 75);
        // Drei Dachebenen
        for (let i = 0; i < 3; i++) {
          const ry = baseY - 75 + i * 24;
          const rw = 17 + i * 8;
          ctx.beginPath();
          ctx.moveTo(sx, ry - 8);
          ctx.lineTo(sx + rw, ry);
          ctx.lineTo(sx - rw, ry);
          ctx.closePath();
          ctx.fill();
        }
      };

      drawPagodaSil(180, 400);
      drawPagodaSil(560, 400);
      drawPagodaSil(980, 400);
      drawPagodaSil(1380, 400);
      drawPagodaSil(1750, 400);

      ctx.restore();
    } else if (theme === "clockwork") {
      // Dark sepia background
      ctx.fillStyle = "#0c0a08";
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Generate gear silhouettes once per level
      if (!level._gearField) {
        level._gearField = [
          { cx: 200,  cy: 95,  r: 75,  teeth: 10, speed:  0.00030 },
          { cx: 700,  cy: 355, r: 95,  teeth: 12, speed: -0.00022 },
          { cx: 1150, cy: 65,  r: 60,  teeth: 8,  speed:  0.00042 },
          { cx: 1650, cy: 370, r: 85,  teeth: 11, speed: -0.00030 },
          { cx: 2150, cy: 110, r: 70,  teeth: 9,  speed:  0.00035 },
          { cx: 2650, cy: 310, r: 100, teeth: 14, speed: -0.00024 },
        ];
      }

      const parallax = camera * 0.2;
      const now = Date.now();

      ctx.save();
      for (const g of level._gearField) {
        const sx = g.cx - parallax;
        if (sx + g.r < -20 || sx - g.r > GAME_W + 20) continue;

        const innerR = g.r * 0.72;
        const toothW = g.r * 0.28;
        const toothH = g.r * 0.27;

        ctx.save();
        ctx.translate(sx, g.cy);
        ctx.rotate(now * g.speed);
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#c8a06a";

        for (let i = 0; i < g.teeth; i++) {
          ctx.save();
          ctx.rotate((i / g.teeth) * Math.PI * 2);
          ctx.fillRect(-toothW / 2, innerR - 2, toothW, toothH + 4);
          ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(0, 0, innerR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
      ctx.restore();

      // Horizontal steam pipes near the top
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = "#c8a06a";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(0, 28);
      ctx.lineTo(GAME_W, 28);
      ctx.stroke();
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 44);
      ctx.lineTo(GAME_W * 0.65, 44);
      ctx.stroke();
      ctx.restore();
    } else if (theme === "desert") {
      // Warmer Himmel – orange → goldgelb
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_H);
      skyGrad.addColorStop(0,   "#d46a1a");
      skyGrad.addColorStop(0.55, "#e8a830");
      skyGrad.addColorStop(1,   "#c8843a");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Sonne (oben rechts)
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#fff5cc";
      ctx.beginPath();
      ctx.arc(680, 52, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(680, 52, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Hintergrund-Dünen-Silhouetten (Parallax)
      const parallax = camera * 0.15;
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#a85f18";

      const drawDune = (px, baseY, w, h) => {
        const sx = px - parallax;
        if (sx + w < -20 || sx > GAME_W + 20) return;
        ctx.beginPath();
        ctx.moveTo(sx, baseY);
        ctx.quadraticCurveTo(sx + w / 2, baseY - h, sx + w, baseY);
        ctx.closePath();
        ctx.fill();
      };

      drawDune(60,   GAME_H, 260,  85);
      drawDune(340,  GAME_H, 190,  65);
      drawDune(590,  GAME_H, 300, 100);
      drawDune(940,  GAME_H, 240,  78);
      drawDune(1220, GAME_H, 280,  92);
      drawDune(1550, GAME_H, 220,  72);
      drawDune(1830, GAME_H, 260,  80);

      ctx.restore();
    } else if (theme === "skatepark") {
      // Abendlicher Stadthimmel: dunkelblau → lila
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_H);
      skyGrad.addColorStop(0,    "#0d0d1a");
      skyGrad.addColorStop(0.55, "#1a0f2e");
      skyGrad.addColorStop(1,    "#0d1a26");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Neon-Glühpunkte (Stadtlichter im Hintergrund)
      if (!level._neonLights) {
        level._neonLights = Array.from({ length: 18 }, () => ({
          x: Math.random() * GAME_W * 2.5,
          y: 180 + Math.random() * 180,
          r: Math.random() * 2 + 1,
          color: ["#ff00ff", "#00ffff", "#ff4444", "#ffcc00", "#44ff88"][Math.floor(Math.random() * 5)],
        }));
      }

      // Gebäude-Silhouetten (Parallax)
      const parallax = camera * 0.18;
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#111";

      const drawBuilding = (px, baseY, w, h) => {
        const sx = px - parallax;
        if (sx + w < -10 || sx > GAME_W + 10) return;
        ctx.fillRect(sx, baseY - h, w, h);
        // Fensterreihen
        for (let row = 0; row < Math.floor(h / 16); row++) {
          for (let col = 0; col < Math.floor(w / 12); col++) {
            if (Math.random() < 0.55) {
              ctx.globalAlpha = 0.18;
              ctx.fillStyle = "#ffffaa";
              ctx.fillRect(sx + col * 12 + 3, baseY - h + row * 16 + 5, 6, 7);
              ctx.fillStyle = "#111";
            }
          }
        }
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#111";
      };

      drawBuilding(80,  GAME_H, 70,  140);
      drawBuilding(200, GAME_H, 50,  100);
      drawBuilding(320, GAME_H, 90,  180);
      drawBuilding(470, GAME_H, 60,  120);
      drawBuilding(620, GAME_H, 80,  160);
      drawBuilding(770, GAME_H, 55,  110);
      drawBuilding(900, GAME_H, 100, 200);

      ctx.restore();

      // Neon-Punkte
      ctx.save();
      for (const n of level._neonLights) {
        const sx = n.x - parallax;
        if (sx < -10 || sx > GAME_W + 10) continue;
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(sx, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (theme === "stoneage") {
      // Höhlenwand: warmer Fels von dunkel oben nach ocker unten
      const rock = ctx.createLinearGradient(0, 0, 0, GAME_H);
      rock.addColorStop(0,    "#150e08");
      rock.addColorStop(0.45, "#2b1d12");
      rock.addColorStop(1,    "#3e2a19");
      ctx.fillStyle = rock;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Höhlenmalerei im Parallax
      if (!level._cavePaintings) {
        const kinds = ["hand", "mammoth", "deer", "hunter", "spiral", "hand", "mammoth", "hunter"];
        level._cavePaintings = kinds.map((kind, i) => ({
          kind,
          x: 120 + i * 330 + Math.random() * 90,
          y: 90 + Math.random() * 190,
          size: 26 + Math.random() * 26,
          ochre: i % 3 === 0 ? "#c9762e" : i % 3 === 1 ? "#b8541f" : "#d09a45",
        }));
      }

      ctx.save();
      const paintShift = camera * 0.3;
      for (const p of level._cavePaintings) {
        const sx = p.x - paintShift;
        if (sx < -90 || sx > GAME_W + 90) continue;
        ctx.globalAlpha = 0.32;
        ctx.strokeStyle = p.ochre;
        ctx.fillStyle = p.ochre;
        ctx.lineWidth = 2;
        this._drawCavePainting(ctx, sx, p.y, p.kind, p.size);
      }
      ctx.restore();

      // Felszacken an der Höhlendecke
      ctx.save();
      ctx.fillStyle = "#0e0906";
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      const ceilShift = camera * 0.55;
      for (let i = 0; i <= 22; i++) {
        const cx = i * 46 - (ceilShift % 46);
        const depth = 16 + ((i * 37) % 26);
        ctx.lineTo(cx - 23, 0);
        ctx.lineTo(cx, depth);
      }
      ctx.lineTo(GAME_W + 10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (theme === "numbers") {
      // Eis oben, Sand unten
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_H);
      skyGrad.addColorStop(0,    "#0a1c2e");
      skyGrad.addColorStop(0.5,  "#123a4e");
      skyGrad.addColorStop(0.82, "#3d3524");
      skyGrad.addColorStop(1,    "#5a4526");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Schwebende Ziffern & Rechenzeichen im Hintergrund
      if (!level._numberField) {
        const glyphs = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "−", "=", "×"];
        level._numberField = Array.from({ length: 26 }, (_, i) => ({
          x: Math.random() * GAME_W * 3,
          y: 30 + Math.random() * (GAME_H - 60),
          size: 16 + Math.random() * 34,
          glyph: glyphs[i % glyphs.length],
          drift: Math.random() * Math.PI * 2,
        }));
      }

      const parallax = camera * 0.22;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const now = Date.now();
      for (const n of level._numberField) {
        const sx = n.x - parallax;
        if (sx < -40 || sx > GAME_W + 40) continue;
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = "#cfe8ff";
        ctx.font = `bold ${n.size}px sans-serif`;
        ctx.fillText(n.glyph, sx, n.y + Math.sin(now / 1400 + n.drift) * 6);
      }
      ctx.restore();

      // Eiskristalle am oberen Rand
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#bfe6ff";
      ctx.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        const sx = ((i * 137 - camera * 0.35) % (GAME_W + 120)) + -60;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx - 7, 22);
        ctx.lineTo(sx + 7, 22);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
    }
  }

  // Einzelnes Höhlenmalerei-Motiv (Steinzeit-Hintergrund)
  _drawCavePainting(ctx, x, y, kind, s) {
    ctx.beginPath();

    if (kind === "hand") {
      // Handabdruck: Handfläche und fünf Finger
      ctx.ellipse(x, y, s * 0.28, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.42;
        ctx.beginPath();
        ctx.lineWidth = s * 0.11;
        ctx.moveTo(x + Math.cos(a) * s * 0.2, y + Math.sin(a) * s * 0.2);
        ctx.lineTo(x + Math.cos(a) * s * 0.58, y + Math.sin(a) * s * 0.58);
        ctx.stroke();
      }
      return;
    }

    if (kind === "mammoth") {
      // Buckliger Körper, Rüssel, Stoßzahn und Stampfer
      ctx.moveTo(x - s * 0.5, y + s * 0.2);
      ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.4, x, y - s * 0.42);
      ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.4, x + s * 0.5, y + s * 0.1);
      ctx.stroke();
      // Rüssel
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.1);
      ctx.quadraticCurveTo(x + s * 0.72, y + s * 0.3, x + s * 0.6, y + s * 0.55);
      ctx.stroke();
      // Stoßzahn
      ctx.beginPath();
      ctx.moveTo(x + s * 0.46, y + s * 0.18);
      ctx.quadraticCurveTo(x + s * 0.7, y + s * 0.5, x + s * 0.38, y + s * 0.5);
      ctx.stroke();
      // Beine
      for (const dx of [-0.34, -0.1, 0.18, 0.4]) {
        ctx.beginPath();
        ctx.moveTo(x + s * dx, y + s * 0.16);
        ctx.lineTo(x + s * dx, y + s * 0.6);
        ctx.stroke();
      }
      return;
    }

    if (kind === "deer") {
      // Hirsch mit Geweih
      ctx.ellipse(x, y, s * 0.36, s * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, y - s * 0.1);
      ctx.lineTo(x + s * 0.55, y - s * 0.42);
      ctx.stroke();
      for (const a of [-0.5, 0.1]) {
        ctx.beginPath();
        ctx.moveTo(x + s * 0.55, y - s * 0.42);
        ctx.lineTo(x + s * 0.55 + Math.cos(a) * s * 0.3, y - s * 0.42 - s * 0.3);
        ctx.stroke();
      }
      for (const dx of [-0.26, -0.05, 0.15]) {
        ctx.beginPath();
        ctx.moveTo(x + s * dx, y + s * 0.16);
        ctx.lineTo(x + s * dx, y + s * 0.55);
        ctx.stroke();
      }
      return;
    }

    if (kind === "hunter") {
      // Strichmännchen mit Speer
      ctx.arc(x, y - s * 0.4, s * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.28);
      ctx.lineTo(x, y + s * 0.16);
      ctx.moveTo(x, y + s * 0.16);
      ctx.lineTo(x - s * 0.22, y + s * 0.55);
      ctx.moveTo(x, y + s * 0.16);
      ctx.lineTo(x + s * 0.22, y + s * 0.55);
      ctx.moveTo(x, y - s * 0.16);
      ctx.lineTo(x - s * 0.28, y + s * 0.02);
      ctx.moveTo(x, y - s * 0.16);
      ctx.lineTo(x + s * 0.3, y - s * 0.3);
      ctx.stroke();
      // Speer
      ctx.beginPath();
      ctx.moveTo(x + s * 0.16, y - s * 0.62);
      ctx.lineTo(x + s * 0.42, y + s * 0.16);
      ctx.stroke();
      return;
    }

    // Spirale
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const a = i * 0.42;
      const r = (i / 40) * s * 0.5;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Felskante für Steinzeit-Plattformen
  _drawRockEdge(ctx, x, y, w, mossy) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;

    // Gezackte Oberkante
    ctx.beginPath();
    ctx.moveTo(x, y);
    let px = x;
    let i = 0;
    while (px < x + w) {
      const stepW = 11 + ((i * 7) % 9);
      px = Math.min(px + stepW, x + w);
      const notch = i % 2 === 0 ? 0 : 2.5;
      ctx.lineTo(px, y + notch);
      i++;
    }
    ctx.stroke();

    // Risse im Fels darunter
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    for (let cx = x + 14; cx < x + w - 8; cx += 46) {
      ctx.beginPath();
      ctx.moveTo(cx, y + 5);
      ctx.lineTo(cx + 4, y + 12);
      ctx.lineTo(cx - 1, y + 19);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Moosbüschel auf der Kante
    if (mossy) {
      ctx.lineWidth = 1.2;
      for (let mx = x + 6; mx < x + w - 4; mx += 15) {
        ctx.beginPath();
        ctx.moveTo(mx, y);
        ctx.lineTo(mx - 2.5, y - 5);
        ctx.moveTo(mx, y);
        ctx.lineTo(mx + 1, y - 6);
        ctx.moveTo(mx, y);
        ctx.lineTo(mx + 3.5, y - 4);
        ctx.stroke();
      }
    }
  }

  // Felskante einer Höhlendecke – man läuft an der Unterseite
  _drawRockEdgeDown(ctx, x, y, w) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(x, y);
    let px = x;
    let i = 0;
    while (px < x + w) {
      const stepW = 11 + ((i * 7) % 9);
      px = Math.min(px + stepW, x + w);
      ctx.lineTo(px, y - (i % 2 === 0 ? 0 : 2.5));
      i++;
    }
    ctx.stroke();

    // Risse nach oben ins Gestein
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    for (let cx = x + 14; cx < x + w - 8; cx += 46) {
      ctx.beginPath();
      ctx.moveTo(cx, y - 5);
      ctx.lineTo(cx + 4, y - 12);
      ctx.lineTo(cx - 1, y - 19);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Farbsteine – als einzige Elemente in ihrer eigenen Farbe,
  // damit man sie auseinanderhalten kann
  drawColorStones(ctx, stones, camera, colors) {
    for (const s of stones) {
      const x = s.x - camera;
      if (x < -40 || x > GAME_W + 40) continue;

      const rgb = colors[s.color] || [255, 255, 255];
      const col = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      const bob = Math.sin(Date.now() / 500 + s.x) * 1.5;

      ctx.save();
      ctx.translate(x, s.y + bob);
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 2;

      // Kristall: oben spitz, unten kantig
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(7, -3);
      ctx.lineTo(5, 9);
      ctx.lineTo(-5, 9);
      ctx.lineTo(-7, -3);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.fill();

      // Schliffkanten
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 9);
      ctx.moveTo(-7, -3);
      ctx.lineTo(7, -3);
      ctx.stroke();

      // Glitzern
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 300 + s.x) * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Levelfarbe über die ganze Szene legen
  applyTint(ctx, tint) {
    if (!tint) return;
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgb(${Math.round(tint.r)},${Math.round(tint.g)},${Math.round(tint.b)})`;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.restore();
  }

  // Leitern aus Ästen und Lianen
  drawLadders(ctx, ladders, camera) {
    if (!ladders) return;
    ctx.strokeStyle = "#fff";

    for (const l of ladders) {
      const x = l.x - camera;
      if (x + l.w < -40 || x > GAME_W + 40) continue;

      // Holme
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, l.y);
      ctx.lineTo(x, l.y + l.h);
      ctx.moveTo(x + l.w, l.y);
      ctx.lineTo(x + l.w, l.y + l.h);
      ctx.stroke();

      // Sprossen, leicht schief wie geknotete Äste
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let sy = l.y + 7; sy < l.y + l.h - 2; sy += 12) {
        const tilt = ((sy / 12) % 2 === 0 ? 1 : -1) * 0.8;
        ctx.moveTo(x - 1, sy - tilt);
        ctx.lineTo(x + l.w + 1, sy + tilt);
      }
      ctx.stroke();
    }
  }

  // Die Burg aus der Zeichnung – Mauern, Zinnen, Fahne
  drawCastle(ctx, castle, camera) {
    if (!castle) return;
    const x = castle.x - camera;
    if (x + castle.w < -80 || x > GAME_W + 80) return;

    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 1.5;

    // Außenmauern
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(x, castle.y + castle.h);
    ctx.lineTo(x, castle.y + 82);
    ctx.moveTo(x + castle.w, castle.y + castle.h);
    ctx.lineTo(x + castle.w, castle.y + 82);
    ctx.stroke();

    // Zinnen auf der Dachlinie
    ctx.beginPath();
    for (let bx = x + 6; bx < x + castle.w - 6; bx += 22) {
      ctx.moveTo(bx, castle.y + 100);
      ctx.lineTo(bx, castle.y + 90);
      ctx.lineTo(bx + 11, castle.y + 90);
      ctx.lineTo(bx + 11, castle.y + 100);
    }
    ctx.stroke();

    // Steinfugen in der Mauer
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    for (let row = 0; row < 4; row++) {
      const ry = castle.y + 150 + row * 18;
      ctx.beginPath();
      ctx.moveTo(x + 4, ry);
      ctx.lineTo(x + castle.w - 4, ry);
      ctx.stroke();
      for (let bx = x + 20 + (row % 2) * 26; bx < x + castle.w - 10; bx += 52) {
        ctx.beginPath();
        ctx.moveTo(bx, ry);
        ctx.lineTo(bx, ry + 18);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 0.75;

    // Fahne auf dem Turm
    const fx = x + 62;
    const fy = castle.y + 20;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy + 40);
    ctx.lineTo(fx, fy - 26);
    ctx.stroke();
    const wave = Math.sin(Date.now() / 240) * 4;
    ctx.beginPath();
    ctx.moveTo(fx, fy - 26);
    ctx.quadraticCurveTo(fx + 16, fy - 22 + wave, fx + 30, fy - 26);
    ctx.lineTo(fx + 30, fy - 12);
    ctx.quadraticCurveTo(fx + 16, fy - 8 + wave, fx, fy - 12);
    ctx.closePath();
    ctx.stroke();

    // Das Schild aus der Zeichnung
    ctx.globalAlpha = 0.6;
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("2. PLATZ", x + 8, castle.y + 132);

    ctx.restore();
  }

  // Siegertreppchen im Burghof
  drawPodium(ctx, goal, camera, placement) {
    const cx = goal.x + goal.w / 2 - camera;
    const base = goal.y + goal.h;

    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 1.8;
    ctx.textAlign = "center";

    // Drei Stufen: 2 – 1 – 3
    const steps = [
      { dx: -46, h: 24, label: "2" },
      { dx: 0, h: 38, label: "1" },
      { dx: 46, h: 16, label: "3" },
    ];
    for (const s of steps) {
      const won = placement && s.label === String(placement);
      ctx.globalAlpha = won ? 1 : 0.55;
      ctx.lineWidth = won ? 2.5 : 1.6;
      ctx.strokeRect(cx + s.dx - 21, base - s.h, 42, s.h);
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(s.label, cx + s.dx, base - s.h / 2 + 5);
    }

    ctx.globalAlpha = 0.5;
    ctx.font = "9px sans-serif";
    ctx.fillText("SIEGERTREPPCHEN", cx, base + 13);
    ctx.restore();
  }

  // Einsammelbare Gegenstände (bisher: die Klebeschuhe)
  drawItems(ctx, items, camera) {
    for (const it of items) {
      if (it.taken) continue;
      const x = it.x - camera;
      if (x < -60 || x > GAME_W + 60) continue;

      const bob = Math.sin(Date.now() / 400) * 2;
      ctx.save();
      ctx.translate(x, it.y + bob);
      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "#fff";
      ctx.lineWidth = 1.8;

      // Kiste aus Stein
      ctx.strokeRect(-20, -14, 40, 28);
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(-20, -6);
      ctx.lineTo(20, -6);
      ctx.moveTo(-6, -14);
      ctx.lineTo(-6, 14);
      ctx.moveTo(8, -6);
      ctx.lineTo(8, 14);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Zwei Schuhe darin
      for (const dx of [-9, 4]) {
        ctx.beginPath();
        ctx.moveTo(dx, 2);
        ctx.lineTo(dx, 7);
        ctx.lineTo(dx + 9, 7);
        ctx.lineTo(dx + 9, 4);
        ctx.lineTo(dx + 3, 2);
        ctx.closePath();
        ctx.stroke();
      }

      // Funkeln, damit man sie nicht übersieht
      const t = Date.now() / 260;
      ctx.globalAlpha = 0.5 + Math.sin(t) * 0.3;
      for (let i = 0; i < 4; i++) {
        const a = t / 2 + (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 27, Math.sin(a) * 20, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("KLEBESCHUHE", 0, 26);
      ctx.restore();
    }
  }

  // Bogen-Knopf nur in Levels mit Bogen einblenden
  setBowVisible(visible) {
    this._toggleButton("btn-shoot", visible);
  }

  // Runter-Knopf nur einblenden, solange man an einer Leiter steht
  setClimbVisible(visible) {
    if (visible === this._climbVisible) return;
    this._climbVisible = visible;
    this._toggleButton("btn-down", visible);
  }

  _toggleButton(id, visible) {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (visible) btn.classList.remove("hidden");
    else btn.classList.add("hidden");
  }

  // Fliegende Pfeile – sie drehen sich in ihre Flugrichtung
  drawArrows(ctx, arrows, camera) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.6;

    for (const a of arrows) {
      const x = a.x - camera;
      if (x < -30 || x > GAME_W + 30) continue;

      ctx.save();
      ctx.translate(x, a.y);
      ctx.rotate(Math.atan2(a.vy, a.vx));

      // Schaft
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
      // Spitze
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(3, -3);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.stroke();
      // Federn
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(-12, -3);
      ctx.moveTo(-9, 0);
      ctx.lineTo(-12, 3);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Feststehende Steinzacken
  drawHazards(ctx, hazards, camera) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.8;

    for (const h of hazards) {
      const x = h.x - camera;
      if (x + h.w < -40 || x > GAME_W + 40) continue;

      const down = h.dir === "down";
      const baseY = down ? h.y : h.y;
      const tipDir = down ? 1 : -1;
      const count = Math.max(2, Math.round(h.w / 15));
      const step = h.w / count;

      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const sx = x + i * step;
        ctx.moveTo(sx, baseY);
        ctx.lineTo(sx + step / 2, baseY + tipDir * h.h);
        ctx.lineTo(sx + step, baseY);
      }
      ctx.stroke();

      // Grundlinie am Fels
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x + h.w, baseY);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Höhlendrache: hängt an der Decke und schnappt im Takt
  _drawDragon(ctx, e) {
    const snapT = e.snapping ? e.snapProgress || 1 : 0;
    const top = -e.h; // Ansatz an der Decke

    // Pfeilschild aufblitzen lassen, wenn gerade ein Pfeil abgeprallt ist
    if (e.shieldFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, e.shieldFlash / 18) * 0.8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, top / 2, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = Math.min(1, e.shieldFlash / 18) * 0.4;
      ctx.beginPath();
      ctx.arc(0, top / 2, 21, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Hals in zwei Bögen
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, top);
    ctx.quadraticCurveTo(-13, top + 18, -9, -20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(11, top);
    ctx.quadraticCurveTo(13, top + 18, 9, -20);
    ctx.stroke();

    // Nackenschuppen
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) {
      const y = top + 6 + i * 8;
      ctx.beginPath();
      ctx.moveTo(-12 + i * 0.5, y);
      ctx.lineTo(-18 + i * 0.5, y + 4);
      ctx.stroke();
    }

    // Kopf
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, -20);
    ctx.quadraticCurveTo(-13, -8, -8, -6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9, -20);
    ctx.quadraticCurveTo(13, -8, 8, -6);
    ctx.stroke();

    // Auge
    ctx.beginPath();
    ctx.arc(-4, -17, 3.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-4, -17, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -17, 2.6, 0, Math.PI * 2);
    ctx.stroke();

    // Maul mit Zähnen, geht beim Schnappen weit auf
    const gap = 3 + snapT * 13;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(8, -6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, -6 + gap);
    ctx.lineTo(7, -6 + gap);
    ctx.stroke();
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const tx = -6 + i * 4;
      ctx.moveTo(tx, -6);
      ctx.lineTo(tx + 2, -6 + gap * 0.45);
      ctx.moveTo(tx + 2, -6 + gap);
      ctx.lineTo(tx + 4, -6 + gap * 0.55);
    }
    ctx.stroke();
  }

  // Fallende Eiszapfen zeichnen (Zustände: hang / fall / broken)
  drawSpikes(ctx, spikes, camera, theme) {
    const stone = theme === "stoneage";

    for (const s of spikes) {
      const x = s.x - camera;
      if (x < -40 || x > GAME_W + 40) continue;

      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "#fff";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Zerbrochen: Splitter, die auseinanderfliegen
      if (s.state === "broken") {
        const t = 1 - s.timer / 30;
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI + (i / 4) * Math.PI;
          const d = 4 + t * 22;
          ctx.beginPath();
          ctx.moveTo(x, s.floorY - 2);
          ctx.lineTo(x + Math.cos(a) * d, s.floorY - 2 + Math.sin(a) * d * 0.6);
          ctx.stroke();
        }
        ctx.restore();
        continue;
      }

      // Aufhängung an der "Decke"
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 10, s.y0 - 2);
      ctx.lineTo(x + 10, s.y0 - 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Warnblinken kurz vor dem Absturz
      let wobble = 0;
      if (s.state === "hang") {
        if (s.timer < 30) {
          if (Math.floor(s.timer / 4) % 2 === 0) {
            ctx.restore();
            continue;
          }
          wobble = Math.sin(Date.now() / 40) * 1.5;
        } else {
          wobble = Math.sin(Date.now() / 500 + s.x) * 0.8;
        }
      }

      ctx.lineWidth = 2;
      if (stone) {
        // Stalaktit: klobiger, mit unregelmäßiger Kante
        ctx.beginPath();
        ctx.moveTo(x - 8 + wobble, s.y);
        ctx.lineTo(x - 3 + wobble, s.y + s.h * 0.35);
        ctx.lineTo(x - 5 + wobble, s.y + s.h * 0.55);
        ctx.lineTo(x + wobble, s.y + s.h);
        ctx.lineTo(x + 5 + wobble, s.y + s.h * 0.5);
        ctx.lineTo(x + 3 + wobble, s.y + s.h * 0.3);
        ctx.lineTo(x + 8 + wobble, s.y);
        ctx.closePath();
        ctx.stroke();
        // Gesteinsschichten
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        for (const f of [0.25, 0.5]) {
          ctx.beginPath();
          ctx.moveTo(x - 6 * (1 - f) + wobble, s.y + s.h * f);
          ctx.lineTo(x + 6 * (1 - f) + wobble, s.y + s.h * f);
          ctx.stroke();
        }
      } else {
        // Eiszapfen: schmales Dreieck mit der Spitze nach unten
        ctx.beginPath();
        ctx.moveTo(x - 6 + wobble, s.y);
        ctx.lineTo(x + 6 + wobble, s.y);
        ctx.lineTo(x + wobble, s.y + s.h);
        ctx.closePath();
        ctx.stroke();

        // Glanzlinie im Zapfen
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(x - 2 + wobble, s.y + 3);
        ctx.lineTo(x + wobble, s.y + s.h - 4);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Zahlen-Anzeige oben mittig (nur im Zahlenland)
  drawNumberHUD(ctx, value, invincible) {
    const cx = GAME_W / 2;
    ctx.save();
    ctx.textAlign = "center";

    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("DU BIST", cx, 8);
    ctx.globalAlpha = 1;

    const pulse = invincible ? Math.sin(Date.now() / 160) * 2 : 0;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.font = `bold ${26 + pulse}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.strokeText(String(value), cx, 36);

    if (invincible) {
      ctx.globalAlpha = 0.7;
      ctx.font = "bold 9px sans-serif";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#fff";
      ctx.fillText("UNBESIEGBAR", cx, 52);
    }
    ctx.restore();
  }

  // Plattformen zeichnen – nur dünne weiße Linien
  drawPlatforms(ctx, platforms, camera) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;

    for (const p of platforms) {
      const x = p.x - camera;
      const y = p.y;

      // Außerhalb des Sichtfelds? Überspringen
      if (x + p.w < -50 || x > GAME_W + 50) continue;

      // ── Schrägplattform (Halfpipe-Wände) ───────────────────
      if (p.slope !== undefined) {
        const y0 = p.y;
        const y1 = p.y + p.slope * p.w;

        ctx.beginPath();
        ctx.moveTo(x,        y0);
        ctx.lineTo(x + p.w,  y1);
        ctx.stroke();

        if (p.surface === "ice") {
          // Gestrichelte Parallellinie als Eis-Markierung
          const dx = p.w, dy = y1 - y0;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = (-dy / len) * 4;
          const ny = ( dx / len) * 4;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.moveTo(x        + nx, y0 + ny);
          ctx.lineTo(x + p.w  + nx, y1 + ny);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        continue;
      }

      // ── Höhlendecke: begehbar ist die Unterseite ────────────
      if (p.ceiling) {
        this._drawRockEdgeDown(ctx, x, p.y + p.h, p.w);
        continue;
      }

      // ── Fels & Moos (Steinzeit) ─────────────────────────────
      if (p.surface === "fels" || p.surface === "moos") {
        this._drawRockEdge(ctx, x, y, p.w, p.surface === "moos");
        continue;
      }

      // ── Normale (horizontale) Plattform ─────────────────────
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + p.w, y);
      ctx.stroke();

      if (p.surface === "ice") {
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x + p.w, y + 4);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (p.surface === "sand") {
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x + p.w, y + 4);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (p.surface === "trampolin") {
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
    ctx.lineWidth = 1.5;
    const now = Date.now();
    const ANIM_DURATION = 600; // ms

    for (const coin of coins) {
      const x = coin.x - camera;
      if (x < -20 || x > GAME_W + 20) continue;

      // Sammel-Animation
      if (coin.collected) {
        if (!coin.collectTime) continue;
        const elapsed = now - coin.collectTime;
        if (elapsed >= ANIM_DURATION) continue;

        const t = elapsed / ANIM_DURATION; // 0 → 1
        const alpha = 1 - t;
        const scale = 1 + t * 2.5;
        const offsetY = -t * 30;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, coin.y + offsetY, 5 * scale, 0, Math.PI * 2);
        ctx.stroke();

        // +10 Text
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${12 + t * 6}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("+10", x, coin.y + offsetY - 12 * scale);
        ctx.restore();
        continue;
      }

      // Normale Münze
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, coin.y, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Punkt in der Mitte
      ctx.fillStyle = "#fff";
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
      if (x < -30 || x > GAME_W + 30) continue;

      const y = t.y + t.h / 2;
      const pulse = Math.sin(Date.now() / 300) * 3;

      // Kreis-Umriss
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 12 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Fragezeichen
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", x, y);
    }
  }

  // Ziel zeichnen – einfache Flagge aus Linien oder Eve
  drawGoal(ctx, goal, camera, theme) {
    const x = goal.x - camera;
    if (x < -80 || x > GAME_W + 80) return;

    if (theme === "walle") {
      this._drawEve(ctx, x, goal);
      return;
    }

    if (theme === "minecraft") {
      this._drawCreeper(ctx, x, goal);
      return;
    }

    if (theme === "ninjago") {
      this._drawSenseiWu(ctx, x, goal);
      return;
    }

    if (theme === "clockwork") {
      this._drawClockworkGear(ctx, x, goal);
      return;
    }

    if (theme === "desert") {
      this._drawPersianGate(ctx, x, goal);
      return;
    }

    if (theme === "numbers") {
      this._drawEqualsGoal(ctx, x, goal);
      return;
    }

    if (theme === "stoneage") {
      this.drawPodium(ctx, goal, camera, 0);
      return;
    }

    const pulse = Math.sin(Date.now() / 400) * 2;

    ctx.strokeStyle = "#fff";
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
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ZIEL", x + 30, goal.y - 46 + pulse);
  }

  // Eve zeichnen (eiförmig, schwebend)
  _drawEve(ctx, x, goal) {
    const centerX = x + 30;
    const baseY = goal.y;
    const hover = Math.sin(Date.now() / 500) * 4;
    const cy = baseY - 15 + hover;

    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    // Körper (Ei-Form)
    ctx.beginPath();
    ctx.ellipse(centerX, cy, 12, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Kopf-Visier (Augenbereich)
    ctx.beginPath();
    ctx.ellipse(centerX, cy - 6, 9, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Augen (leuchtende Punkte)
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(centerX - 4, cy - 6, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 4, cy - 6, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arme (schwebend, leicht seitlich)
    const armWave = Math.sin(Date.now() / 600) * 3;
    // Linker Arm
    ctx.beginPath();
    ctx.moveTo(centerX - 12, cy - 2);
    ctx.quadraticCurveTo(
      centerX - 22,
      cy + armWave,
      centerX - 18,
      cy + 10 + armWave,
    );
    ctx.stroke();
    // Rechter Arm
    ctx.beginPath();
    ctx.moveTo(centerX + 12, cy - 2);
    ctx.quadraticCurveTo(
      centerX + 22,
      cy - armWave,
      centerX + 18,
      cy + 10 - armWave,
    );
    ctx.stroke();

    // "EVE" Text
    const blink = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.globalAlpha = blink;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("EVE", centerX, cy - 28 + hover);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // Creeper zeichnen (Minecraft-Stil, blockig)
  _drawCreeper(ctx, x, goal) {
    const centerX = x + 30;
    const baseY = goal.y + goal.h;
    const pulse = Math.sin(Date.now() / 600) * 1.5;

    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";

    // Füße (2 Blöcke)
    ctx.strokeRect(centerX - 9, baseY - 10, 7, 10);
    ctx.strokeRect(centerX + 2, baseY - 10, 7, 10);

    // Körper (hoher Block)
    ctx.strokeRect(centerX - 8, baseY - 30, 16, 20);

    // Kopf (großer Block)
    const headY = baseY - 46 + pulse;
    ctx.strokeRect(centerX - 10, headY, 20, 16);

    // Creeper-Gesicht (das ikonische Muster)
    ctx.fillStyle = "#fff";
    // Augen (2 quadratische Pixel)
    ctx.fillRect(centerX - 7, headY + 3, 4, 4);
    ctx.fillRect(centerX + 3, headY + 3, 4, 4);
    // Mund (T-Form / trauriges Gesicht)
    ctx.fillRect(centerX - 2, headY + 8, 4, 2);
    ctx.fillRect(centerX - 4, headY + 10, 2, 3);
    ctx.fillRect(centerX + 2, headY + 10, 2, 3);

    // "ZIEL" Text
    const blink = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.globalAlpha = blink;
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ZIEL", centerX, headY - 6 + pulse);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // Sensei Wu zeichnen (alter Ninja-Meister mit Hut und Stab)
  _drawSenseiWu(ctx, x, goal) {
    const centerX = x + 30;
    const baseY = goal.y + goal.h;
    const hover = Math.sin(Date.now() / 700) * 1.8;

    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Beine (alt und gebückt)
    ctx.beginPath();
    ctx.moveTo(centerX - 4, baseY + hover);
    ctx.lineTo(centerX - 3, baseY - 13 + hover);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 4, baseY + hover);
    ctx.lineTo(centerX + 3, baseY - 13 + hover);
    ctx.stroke();

    // Robe / Körper (breites Gewand)
    ctx.beginPath();
    ctx.moveTo(centerX - 3, baseY - 13 + hover);
    ctx.lineTo(centerX + 3, baseY - 13 + hover);
    ctx.lineTo(centerX + 7, baseY - 32 + hover);
    ctx.lineTo(centerX - 7, baseY - 32 + hover);
    ctx.closePath();
    ctx.stroke();

    // Arme (linker Arm auf Stab gestützt, rechter frei)
    ctx.beginPath();
    ctx.moveTo(centerX - 7, baseY - 28 + hover);
    ctx.lineTo(centerX - 16, baseY - 17 + hover);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 7, baseY - 28 + hover);
    ctx.lineTo(centerX + 11, baseY - 19 + hover);
    ctx.stroke();

    // Stab
    ctx.beginPath();
    ctx.moveTo(centerX - 16, baseY - 17 + hover);
    ctx.lineTo(centerX - 16, baseY + 2 + hover);
    ctx.stroke();

    // Kopf
    const headY = baseY - 45 + hover;
    ctx.beginPath();
    ctx.arc(centerX, headY, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Langer Spitzbart
    ctx.beginPath();
    ctx.moveTo(centerX - 3, headY + 6);
    ctx.quadraticCurveTo(
      centerX - 1,
      headY + 16,
      centerX + 1,
      headY + 24 + hover * 0.2,
    );
    ctx.stroke();

    // Konischer Sugegasa-Hut
    ctx.beginPath();
    ctx.moveTo(centerX - 17, headY - 3 + hover);
    ctx.lineTo(centerX, headY - 20 + hover);
    ctx.lineTo(centerX + 17, headY - 3 + hover);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - 17, headY - 3 + hover);
    ctx.lineTo(centerX + 17, headY - 3 + hover);
    ctx.stroke();

    // "SENSEI WU" Text (blinkend)
    const blink = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.globalAlpha = blink;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SENSEI WU", centerX, headY - 26 + hover);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // Drehendes Meister-Zahnrad als Ziel
  _drawClockworkGear(ctx, x, goal) {
    const now = Date.now();
    const centerX = x + 30;
    const centerY = goal.y - 4;
    const pulse = Math.sin(now / 380) * 1.5;
    const outerR = 16 + pulse;
    const innerR = outerR * 0.68;
    const toothCount = 8;
    const toothW = 6;
    const toothH = 7;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(now * 0.0009);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";

    // Teeth
    for (let i = 0; i < toothCount; i++) {
      ctx.save();
      ctx.rotate((i / toothCount) * Math.PI * 2);
      ctx.strokeRect(-toothW / 2, innerR, toothW, toothH);
      ctx.restore();
    }

    // Main circle
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);
    ctx.stroke();

    // 4 Spokes
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, innerR * 0.28);
      ctx.lineTo(0, innerR - 1);
      ctx.stroke();
      ctx.restore();
    }

    // Hub
    ctx.beginPath();
    ctx.arc(0, 0, innerR * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // "ZIEL" blinking text
    const blink = Math.sin(now / 400) * 0.3 + 0.7;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ZIEL", centerX, centerY - outerR - 10);
    ctx.restore();
  }

  // Persisches Tor (Hufeisenbogen + Zwiebelkuppel) als Ziel
  _drawPersianGate(ctx, x, goal) {
    const cx = x + 30;
    const baseY = goal.y + goal.h;
    const hover = Math.sin(Date.now() / 650) * 1.8;

    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const archW = 32;
    const archY = baseY - 38 + hover;

    // Zwei Säulen
    ctx.strokeRect(cx - archW / 2,     archY + 12, 6, 26);
    ctx.strokeRect(cx + archW / 2 - 6, archY + 12, 6, 26);

    // Hufeisenbogen
    ctx.beginPath();
    ctx.moveTo(cx - archW / 2, archY + 22);
    ctx.quadraticCurveTo(cx - archW / 2 - 3, archY + 10, cx, archY + 2);
    ctx.quadraticCurveTo(cx + archW / 2 + 3, archY + 10, cx + archW / 2, archY + 22);
    ctx.stroke();

    // Zwiebelkuppel
    ctx.beginPath();
    ctx.moveTo(cx - 9, archY + 2);
    ctx.quadraticCurveTo(cx - 13, archY - 10, cx, archY - 20);
    ctx.quadraticCurveTo(cx + 13, archY - 10, cx + 9, archY + 2);
    ctx.stroke();

    // Knauf auf der Kuppel
    ctx.beginPath();
    ctx.moveTo(cx, archY - 20);
    ctx.lineTo(cx, archY - 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, archY - 30, 2, 0, Math.PI * 2);
    ctx.stroke();

    // Stern im Bogen
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★", cx, archY + 17 + hover);

    // "ZIEL" blinkend
    const blink = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.globalAlpha = blink;
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("ZIEL", cx, archY - 35 + hover);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // Großes Gleichheitszeichen als Ziel (Zahlenland)
  _drawEqualsGoal(ctx, x, goal) {
    const cx = x + goal.w / 2;
    const cy = goal.y + goal.h / 2;
    const now = Date.now();
    const pulse = Math.sin(now / 380) * 2;
    const barW = 46 + pulse;

    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    ctx.lineCap = "round";

    // Strahlenkranz hinter dem Zeichen
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = now / 2200 + (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34);
      ctx.lineTo(cx + Math.cos(a) * (44 + pulse), cy + Math.sin(a) * (44 + pulse));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Die beiden Balken des "="
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - barW / 2, cy - 9);
    ctx.lineTo(cx + barW / 2, cy - 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - barW / 2, cy + 9);
    ctx.lineTo(cx + barW / 2, cy + 9);
    ctx.stroke();

    // "ZIEL" blinkend darüber
    const blink = Math.sin(now / 400) * 0.3 + 0.7;
    ctx.globalAlpha = blink;
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ZIEL", cx, cy - 34);
    ctx.globalAlpha = 0.5;
    ctx.font = "9px sans-serif";
    ctx.fillText("wie viel bist du?", cx, cy + 40);

    ctx.restore();
  }

  // Minus-Monster (Zahlenland): frisst eine Stelle deiner Zahl
  _drawMinusMonster(ctx, e) {
    const knocked = e.state === "knocked";
    const bob = knocked ? 0 : Math.sin(Date.now() / 220 + e.x * 0.05) * 1.5;

    ctx.lineWidth = 2;

    // Körper (runder Klumpen)
    ctx.beginPath();
    ctx.ellipse(0, -16 + bob, 11, 13, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Zackenkamm oben
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -25 + bob);
    ctx.lineTo(-5, -32 + bob);
    ctx.lineTo(-2, -26 + bob);
    ctx.lineTo(2, -33 + bob);
    ctx.lineTo(5, -26 + bob);
    ctx.lineTo(8, -31 + bob);
    ctx.stroke();

    // Böse Augen
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, -23 + bob);
    ctx.lineTo(-3, -21 + bob);
    ctx.moveTo(3, -21 + bob);
    ctx.lineTo(7, -23 + bob);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-4.5, -19 + bob, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4.5, -19 + bob, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Das Minuszeichen als Mund – das ist die Bedrohung
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -12 + bob);
    ctx.lineTo(6, -12 + bob);
    ctx.stroke();

    // Ärmchen
    ctx.lineWidth = 1.5;
    const wave = knocked ? 6 : Math.sin(Date.now() / 200 + e.x * 0.09) * 3;
    ctx.beginPath();
    ctx.moveTo(-11, -16 + bob);
    ctx.lineTo(-17, -12 + bob + wave);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(11, -16 + bob);
    ctx.lineTo(17, -12 + bob - wave);
    ctx.stroke();

    // Beinchen
    const step = knocked ? 5 : Math.sin(Date.now() / 180 + e.x * 0.07) * 3;
    ctx.beginPath();
    ctx.moveTo(-4, -3 + bob);
    ctx.lineTo(-5 + step, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, -3 + bob);
    ctx.lineTo(5 - step, 0);
    ctx.stroke();
  }

  // Höhlenviech: kleiner Fellklumpen mit großen Augen
  _drawCritter(ctx, e) {
    const knocked = e.state === "knocked";
    const bob = knocked ? 0 : Math.sin(Date.now() / 190 + e.x * 0.06) * 1.5;

    // Zotteliger Körper
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -13 + bob, 11, 11, 0, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    let zx = -11;
    ctx.moveTo(zx, -13 + bob);
    for (let i = 0; zx < 11; i++) {
      zx += 3.7;
      ctx.lineTo(zx, -13 + bob + (i % 2 === 0 ? 4 : 0));
    }
    ctx.stroke();

    // Große Augen
    ctx.lineWidth = 1.5;
    for (const dx of [-4.5, 4.5]) {
      ctx.beginPath();
      ctx.arc(dx, -17 + bob, 3.2, 0, Math.PI * 2);
      ctx.stroke();
      // Blickrichtung: das Spiegeln erledigt schon drawEnemies
      ctx.beginPath();
      ctx.arc(dx + 1.1, -17 + bob, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Zwei kleine Zähne
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-2.5, -9 + bob);
    ctx.lineTo(-1.5, -6 + bob);
    ctx.moveTo(2.5, -9 + bob);
    ctx.lineTo(1.5, -6 + bob);
    ctx.stroke();

    // Beinchen
    const step = knocked ? 4 : Math.sin(Date.now() / 150 + e.x * 0.08) * 3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -4 + bob);
    ctx.lineTo(-6 + step, 0);
    ctx.moveTo(5, -4 + bob);
    ctx.lineTo(6 - step, 0);
    ctx.stroke();
  }

  // Fleischfressende Pflanze: schnappt im Takt nach oben
  _drawPlant(ctx, e) {
    // snapT: 0 = geschlossen, 1 = weit aufgerissen
    const snapT = e.snapping ? e.snapProgress || 1 : 0;
    const headY = -22 - snapT * 10;

    // Stiel, der beim Schnappen mitschwingt
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(snapT * 3, headY / 2, 0, headY + 6);
    ctx.stroke();

    // Zwei Blätter am Stiel
    ctx.lineWidth = 1.5;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(dir * 9, -13, dir * 13, -7);
      ctx.quadraticCurveTo(dir * 8, -5, 0, -8);
      ctx.stroke();
    }

    // Blütenkopf mit Zacken
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, headY, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const len = 8 + snapT * 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8, headY + Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a) * (len + 5), headY + Math.sin(a) * (len + 5));
      ctx.stroke();
    }

    // Gesicht: Augen und Maul, das beim Schnappen aufgeht
    ctx.beginPath();
    ctx.arc(-3, headY - 2, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, headY - 2, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (snapT > 0.1) {
      // Aufgerissenes Maul mit Zähnen
      ctx.moveTo(-4.5, headY + 2);
      ctx.lineTo(-2, headY + 2 + snapT * 4);
      ctx.lineTo(0.5, headY + 2);
      ctx.lineTo(3, headY + 2 + snapT * 4);
      ctx.lineTo(4.5, headY + 2);
    } else {
      ctx.moveTo(-4, headY + 3);
      ctx.lineTo(4, headY + 3);
    }
    ctx.stroke();
  }

  // Borstenvieh: flacher Igel mit langen Stacheln
  _drawBristle(ctx, e) {
    const knocked = e.state === "knocked";
    const bob = knocked ? 0 : Math.sin(Date.now() / 240 + e.x * 0.05) * 1.2;

    // Borsten
    ctx.lineWidth = 1.4;
    for (let i = 0; i <= 9; i++) {
      const t = i / 9;
      const bx = -11 + t * 22;
      const a = -Math.PI / 2 + (t - 0.5) * 1.7;
      ctx.beginPath();
      ctx.moveTo(bx, -11 + bob);
      ctx.lineTo(bx + Math.cos(a) * 13, -11 + bob + Math.sin(a) * 13);
      ctx.stroke();
    }

    // Rundlicher Körper
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -8 + bob, 12, 8, 0, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, -8 + bob);
    ctx.lineTo(12, -8 + bob);
    ctx.stroke();

    // Schnauze nach vorne – das Spiegeln erledigt schon drawEnemies
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, -9 + bob);
    ctx.lineTo(17, -6 + bob);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(17, -6 + bob, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -11 + bob, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Füßchen
    const step = knocked ? 4 : Math.sin(Date.now() / 160 + e.x * 0.07) * 2.5;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -2 + bob);
    ctx.lineTo(-7 + step, 0);
    ctx.moveTo(6, -2 + bob);
    ctx.lineTo(7 - step, 0);
    ctx.stroke();
  }

  // Gegner zeichnen – je nach Theme unterschiedliche Figuren
  drawEnemies(ctx, enemies, camera, theme) {
    for (const e of enemies) {
      if (e.state === "dead") continue;

      const x = e.x - camera + e.w / 2;
      const y = e.y + e.h;

      if (x < -60 || x > GAME_W + 60) continue;

      ctx.save();
      ctx.translate(x, y);

      if (e.state === "knocked") {
        // Wegfliegen: Spin + Fade
        const t = 1 - e.knockTimer / 50;
        ctx.globalAlpha = Math.max(0, 1 - t * 1.3);
        ctx.rotate(t * Math.PI * 3 * (e.vx >= 0 ? 1 : -1));
      } else {
        ctx.scale(e.facing, 1);
      }

      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "#fff";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (theme === "desert") {
        this._drawScorpion(ctx, e);
        ctx.restore();
        continue;
      }

      if (theme === "numbers") {
        this._drawMinusMonster(ctx, e);
        ctx.restore();
        continue;
      }

      if (theme === "stoneage") {
        if (e.kind === "dragon") this._drawDragon(ctx, e);
        else if (e.kind === "plant") this._drawPlant(ctx, e);
        else if (e.kind === "bristle") this._drawBristle(ctx, e);
        else this._drawCritter(ctx, e);
        ctx.restore();
        continue;
      }

      ctx.lineWidth = 2;

      const h = e.h;
      const hr = 7;
      const bodyTop = -h + hr * 2;
      const bodyBottom = bodyTop + 14;

      // ── Kopf ──
      ctx.beginPath();
      ctx.arc(0, -h + hr, hr, 0, Math.PI * 2);
      ctx.stroke();

      // Böse V-förmige Augenbrauen
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, -h + hr - 4);
      ctx.lineTo(-1, -h + hr - 2);
      ctx.moveTo(1, -h + hr - 2);
      ctx.lineTo(5, -h + hr - 4);
      ctx.stroke();

      // X-Augen (Totenschädel-Stil)
      ctx.beginPath();
      ctx.moveTo(-4.5, -h + hr - 1.5);
      ctx.lineTo(-1.5, -h + hr + 1.5);
      ctx.moveTo(-1.5, -h + hr - 1.5);
      ctx.lineTo(-4.5, -h + hr + 1.5);
      ctx.moveTo(1.5, -h + hr - 1.5);
      ctx.lineTo(4.5, -h + hr + 1.5);
      ctx.moveTo(4.5, -h + hr - 1.5);
      ctx.lineTo(1.5, -h + hr + 1.5);
      ctx.stroke();
      ctx.lineWidth = 2;

      // ── Rumpf ──
      ctx.beginPath();
      ctx.moveTo(0, bodyTop);
      ctx.lineTo(0, bodyBottom);
      ctx.stroke();

      // ── Arme ──
      if (e.state === "knocked") {
        // Arme weit ausgestreckt beim Wegfliegen
        ctx.beginPath();
        ctx.moveTo(0, bodyTop + 3);
        ctx.lineTo(-14, bodyTop - 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, bodyTop + 3);
        ctx.lineTo(14, bodyTop - 3);
        ctx.stroke();
      } else {
        // Kampfhaltung mit leichter Wackel-Animation
        const armWave = Math.sin(Date.now() / 280 + e.x * 0.05) * 3;
        ctx.beginPath();
        ctx.moveTo(0, bodyTop + 3);
        ctx.lineTo(-11, bodyTop + 9 + armWave);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, bodyTop + 3);
        ctx.lineTo(11, bodyTop + 9 - armWave);
        ctx.stroke();
      }

      // ── Beine ──
      if (e.state === "knocked") {
        ctx.beginPath();
        ctx.moveTo(0, bodyBottom);
        ctx.lineTo(-9, bodyBottom - 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, bodyBottom);
        ctx.lineTo(9, bodyBottom - 7);
        ctx.stroke();
      } else {
        const legSwing = Math.sin(Date.now() / 260 + e.x * 0.07) * 5;
        ctx.beginPath();
        ctx.moveTo(0, bodyBottom);
        ctx.lineTo(-5 + legSwing, bodyBottom + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, bodyBottom);
        ctx.lineTo(5 - legSwing, bodyBottom + 12);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Skorpion (Wüsten-Level Gegner)
  // Koordinatensystem: (0,0) = Bodenmitte, y wächst nach oben (negativ = hoch)
  // facing=+1 → Bewegung nach rechts, Scheren bei +x, Schwanz bei -x
  _drawScorpion(ctx, e) {
    const knocked = e.state === "knocked";

    // ── Körper (Abdomen + Cephalothorax) ──────────────────────
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -18, 6, 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(5, -17, 3, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // ── Schwanz (Telson, nach oben gebogen) ───────────────────
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-5, -24);
    ctx.quadraticCurveTo(-16, -32, -10, -37);
    ctx.stroke();

    // Giftblase
    ctx.beginPath();
    ctx.arc(-10, -36, 2, 0, Math.PI * 2);
    ctx.fill();

    // Stachel
    ctx.beginPath();
    ctx.moveTo(-9, -35);
    ctx.lineTo(-6, -38);
    ctx.stroke();

    if (knocked) {
      // ── Scheren aufgerissen ──────────────────────────────────
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(5, -22); ctx.lineTo(13, -28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, -28); ctx.lineTo(17, -24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, -28); ctx.lineTo(16, -32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -14); ctx.lineTo(13, -8);  ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13,  -8); ctx.lineTo(17, -12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13,  -8); ctx.lineTo(16,  -4); ctx.stroke();

      // ── Beine ausgestreckt ───────────────────────────────────
      ctx.lineWidth = 1.3;
      for (const lx of [-5, -2, 1, 4]) {
        ctx.beginPath();
        ctx.moveTo(lx, -10);
        ctx.lineTo(lx - 7, -4);
        ctx.lineTo(lx - 6,  0);
        ctx.stroke();
      }
    } else {
      // ── Scheren (Chelae) ─────────────────────────────────────
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(12, -26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -26); ctx.lineTo(15, -23); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -26); ctx.lineTo(15, -29); ctx.stroke();

      ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(12, -11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -11); ctx.lineTo(15, -14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -11); ctx.lineTo(15,  -8); ctx.stroke();

      // ── Beine (4 Stück, Lauf-Animation) ──────────────────────
      ctx.lineWidth = 1.3;
      const sway = Math.sin(Date.now() / 200 + e.x * 0.08) * 2;
      const legXs = [-5, -2, 1, 4];
      for (let i = 0; i < legXs.length; i++) {
        const lx = legXs[i];
        const sw = i % 2 === 0 ? sway : -sway;
        ctx.beginPath();
        ctx.moveTo(lx, -10);
        ctx.lineTo(lx - 4 + sw, -5);
        ctx.lineTo(lx - 3 + sw,  0);
        ctx.stroke();
      }
    }
  }

  // Physik-Info Anzeige
  drawPhysicsInfo(ctx, player) {
    const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2).toFixed(1);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`v: ${speed} px/f`, GAME_W - 10, GAME_H - 10);
  }
}

// Touch-Controls Setup – mit Multi-Touch und visuellem Feedback
export function setupTouchControls(keys) {
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnJump = document.getElementById("btn-jump");

  // Aktive Touches pro Button tracken
  const activeTouches = new Map();

  function bind(btn, key) {
    btn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
          activeTouches.set(t.identifier, { btn, key });
        }
        keys[key] = true;
        btn.classList.add("active");
      },
      { passive: false },
    );

    btn.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
          activeTouches.delete(t.identifier);
        }
        // Nur loslassen wenn kein Touch mehr auf diesem Button
        let stillPressed = false;
        for (const [, v] of activeTouches) {
          if (v.key === key) {
            stillPressed = true;
            break;
          }
        }
        if (!stillPressed) {
          keys[key] = false;
          btn.classList.remove("active");
        }
      },
      { passive: false },
    );

    btn.addEventListener("touchcancel", (e) => {
      for (const t of e.changedTouches) {
        activeTouches.delete(t.identifier);
      }
      let stillPressed = false;
      for (const [, v] of activeTouches) {
        if (v.key === key) {
          stillPressed = true;
          break;
        }
      }
      if (!stillPressed) {
        keys[key] = false;
        btn.classList.remove("active");
      }
    });
  }

  bind(btnLeft, "left");
  bind(btnRight, "right");
  bind(btnJump, "jump");

  // Bogen-Knopf gibt es nur in Levels mit Bogen
  const btnShoot = document.getElementById("btn-shoot");
  if (btnShoot) bind(btnShoot, "shoot");

  // Runter-Knopf erscheint nur an Leitern
  const btnDown = document.getElementById("btn-down");
  if (btnDown) bind(btnDown, "down");
}
