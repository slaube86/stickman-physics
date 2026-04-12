// level.js – Level-Daten und Welt-Scrolling

export const LEVELS = [
  // Level 1 – Tutorial: Laufen & Springen
  {
    id: 1,
    name: 'Tutorial',
    theme: 'normal',
    spawnX: 50,
    spawnY: 300,
    platforms: [
      // Boden
      { x: 0,   y: 370, w: 300,  h: 30, surface: 'normal' },
      { x: 350, y: 370, w: 200,  h: 30, surface: 'normal' },
      { x: 600, y: 370, w: 400,  h: 30, surface: 'normal' },
      // Plattformen
      { x: 250, y: 300, w: 80,  h: 15, surface: 'normal' },
      { x: 450, y: 260, w: 80,  h: 15, surface: 'normal' },
      { x: 650, y: 300, w: 80,  h: 15, surface: 'normal' },
      // Höhere Plattformen
      { x: 800, y: 240, w: 100, h: 15, surface: 'normal' },
      { x: 950, y: 310, w: 120, h: 15, surface: 'normal' },
      // Boden weiter
      { x: 1050, y: 370, w: 400, h: 30, surface: 'normal' },
      // Ziel-Plattform
      { x: 1350, y: 300, w: 80,  h: 15, surface: 'normal' },
    ],
    coins: [
      { x: 280, y: 275 },
      { x: 480, y: 235 },
      { x: 680, y: 275 },
      { x: 840, y: 215 },
      { x: 1000, y: 285 },
      { x: 1200, y: 345 },
    ],
    learnTriggers: [
      { x: 200, y: 340, w: 40, h: 40, factId: 'gravity', triggered: false },
      { x: 450, y: 230, w: 40, h: 40, factId: 'potential_energy', triggered: false },
    ],
    goal: { x: 1360, y: 270, w: 60, h: 30 },
    worldWidth: 1500,
  },

  // Level 6 – Weltraum/Mond
  {
    id: 6,
    name: 'Weltraum/Mond',
    theme: 'space',
    spawnX: 100,
    spawnY: 300,
    gravity: 0.15, // sehr geringe Schwerkraft
    platforms: [
      // Startplattform (Mondboden)
      { x: 0, y: 370, w: 300, h: 30, surface: 'normal' },
      // Schwebende Plattformen
      { x: 200, y: 270, w: 80, h: 15, surface: 'normal' },
      { x: 350, y: 200, w: 80, h: 15, surface: 'normal' },
      { x: 500, y: 130, w: 80, h: 15, surface: 'normal' },
      { x: 650, y: 70,  w: 80, h: 15, surface: 'normal' },
      { x: 800, y: 120, w: 80, h: 15, surface: 'normal' },
      { x: 950, y: 200, w: 80, h: 15, surface: 'normal' },
      // Zielplattform (Mondbasis)
      { x: 1100, y: 270, w: 120, h: 20, surface: 'normal' },
    ],
    coins: [
      { x: 230, y: 245 },
      { x: 380, y: 175 },
      { x: 530, y: 105 },
      { x: 680, y: 45 },
      { x: 830, y: 95 },
      { x: 980, y: 175 },
    ],
    learnTriggers: [
      { x: 120, y: 340, w: 40, h: 40, factId: 'moon_gravity', triggered: false },
      { x: 700, y: 40, w: 40, h: 40, factId: 'space_jump', triggered: false },
    ],
    goal: { x: 1150, y: 240, w: 60, h: 30 },
    worldWidth: 1300,
    worldTop: -200, // vertikales Scrolling aktivieren
  },

  // Level 2 – Eishöhle
  {
    id: 2,
    name: 'Eishöhle',
    theme: 'ice',
    spawnX: 50,
    spawnY: 300,
    platforms: [
      // Startboden (normal)
      { x: 0,   y: 370, w: 200,  h: 30, surface: 'normal' },
      // Eis-Boden
      { x: 250, y: 370, w: 300,  h: 30, surface: 'ice' },
      { x: 600, y: 370, w: 250,  h: 30, surface: 'ice' },
      // Eis-Plattformen
      { x: 350, y: 290, w: 90,  h: 15, surface: 'ice' },
      { x: 550, y: 250, w: 90,  h: 15, surface: 'ice' },
      // Sand-Bereich
      { x: 900, y: 370, w: 200,  h: 30, surface: 'sand' },
      { x: 950, y: 300, w: 80,  h: 15, surface: 'sand' },
      // Weiterer Boden
      { x: 1150, y: 370, w: 350, h: 30, surface: 'normal' },
      // Trampolin!
      { x: 1250, y: 365, w: 60,  h: 10, surface: 'trampolin' },
      // Hohe Zielplattform
      { x: 1350, y: 240, w: 100, h: 15, surface: 'normal' },
    ],
    coins: [
      { x: 300, y: 345 },
      { x: 400, y: 345 },
      { x: 380, y: 265 },
      { x: 580, y: 225 },
      { x: 700, y: 345 },
      { x: 980, y: 275 },
      { x: 1280, y: 340 },
      { x: 1390, y: 215 },
    ],
    learnTriggers: [
      { x: 300, y: 340, w: 40, h: 40, factId: 'friction', triggered: false },
      { x: 930, y: 340, w: 40, h: 40, factId: 'damping', triggered: false },
      { x: 1260, y: 330, w: 40, h: 40, factId: 'elasticity', triggered: false },
    ],
    goal: { x: 1370, y: 210, w: 60, h: 30 },
    worldWidth: 1550,
  },

  // Level 3 – Sprungturm
  {
    id: 3,
    name: 'Sprungturm',
    theme: 'normal',
    spawnX: 50,
    spawnY: 300,
    platforms: [
      { x: 0,   y: 370, w: 200,  h: 30, surface: 'normal' },
      { x: 150, y: 320, w: 80,  h: 15, surface: 'normal' },
      { x: 280, y: 270, w: 80,  h: 15, surface: 'normal' },
      { x: 400, y: 220, w: 80,  h: 15, surface: 'normal' },
      { x: 520, y: 170, w: 80,  h: 15, surface: 'normal' },
      { x: 650, y: 130, w: 100, h: 15, surface: 'normal' },
      // Abstieg
      { x: 800, y: 180, w: 80,  h: 15, surface: 'normal' },
      { x: 920, y: 240, w: 80,  h: 15, surface: 'normal' },
      { x: 1040, y: 300, w: 80, h: 15, surface: 'normal' },
      { x: 1150, y: 370, w: 300, h: 30, surface: 'normal' },
      // Trampolin-Kette
      { x: 1200, y: 365, w: 50, h: 10, surface: 'trampolin' },
      { x: 1350, y: 250, w: 80, h: 15, surface: 'normal' },
    ],
    coins: [
      { x: 180, y: 295 },
      { x: 310, y: 245 },
      { x: 430, y: 195 },
      { x: 550, y: 145 },
      { x: 690, y: 105 },
      { x: 840, y: 155 },
      { x: 950, y: 215 },
      { x: 1070, y: 275 },
      { x: 1230, y: 340 },
      { x: 1380, y: 225 },
    ],
    learnTriggers: [
      { x: 530, y: 140, w: 40, h: 40, factId: 'potential_energy', triggered: false },
      { x: 690, y: 100, w: 40, h: 40, factId: 'kinetic_energy', triggered: false },
    ],
    goal: { x: 1360, y: 220, w: 60, h: 30 },
    worldWidth: 1500,
  },

  // Level 4 – Wall-E findet Eve
  {
    id: 4,
    name: 'Wall-E findet Eve',
    theme: 'walle',
    spawnX: 50,
    spawnY: 300,
    platforms: [
      // Schrottplatz-Start
      { x: 0,   y: 370, w: 250,  h: 30, surface: 'normal' },
      { x: 200, y: 320, w: 70,  h: 15, surface: 'normal' },
      { x: 320, y: 370, w: 150,  h: 30, surface: 'sand' },
      // Müllberge
      { x: 500, y: 340, w: 100, h: 30, surface: 'normal' },
      { x: 550, y: 290, w: 70,  h: 15, surface: 'normal' },
      { x: 650, y: 370, w: 120,  h: 30, surface: 'normal' },
      // Trampolin-Sprungfeld (Wall-E Pressblock)
      { x: 800, y: 365, w: 60,  h: 10, surface: 'trampolin' },
      // Plattformen hoch zu Eve
      { x: 900, y: 300, w: 90, h: 15, surface: 'normal' },
      { x: 1020, y: 370, w: 200, h: 30, surface: 'normal' },
      { x: 1060, y: 310, w: 80, h: 15, surface: 'normal' },
      // Eis-Rutsche (glatter Metall-Boden)
      { x: 1250, y: 370, w: 250, h: 30, surface: 'ice' },
      { x: 1300, y: 310, w: 70, h: 15, surface: 'ice' },
      // Letzter Sprung zu Eve
      { x: 1530, y: 370, w: 200, h: 30, surface: 'normal' },
      { x: 1580, y: 310, w: 80, h: 15, surface: 'normal' },
      { x: 1700, y: 280, w: 100, h: 15, surface: 'normal' },
    ],
    coins: [
      { x: 230, y: 295 },
      { x: 380, y: 345 },
      { x: 540, y: 315 },
      { x: 580, y: 265 },
      { x: 700, y: 345 },
      { x: 830, y: 340 },
      { x: 940, y: 275 },
      { x: 1100, y: 285 },
      { x: 1330, y: 285 },
      { x: 1620, y: 285 },
      { x: 1740, y: 255 },
    ],
    learnTriggers: [
      { x: 340, y: 340, w: 40, h: 40, factId: 'walle_energy', triggered: false },
      { x: 810, y: 330, w: 40, h: 40, factId: 'walle_solar', triggered: false },
      { x: 1270, y: 340, w: 40, h: 40, factId: 'walle_friction_metal', triggered: false },
    ],
    goal: { x: 1710, y: 250, w: 60, h: 30 },
    worldWidth: 1850,
  },

  // Level 5 – Minecraft: Turm nach oben
  {
    id: 5,
    name: 'Minecraft Turm',
    theme: 'minecraft',
    spawnX: 250,
    spawnY: 300,
    worldTop: -700,
    platforms: [
      // Gras-Boden
      { x: 100, y: 370, w: 600, h: 30, surface: 'normal' },

      // Aufstieg Phase 1 – Blockstufen (zigzag, 80px Abstände)
      { x: 430, y: 290, w: 150, h: 15, surface: 'normal' },
      { x: 180, y: 210, w: 160, h: 15, surface: 'normal' },
      { x: 400, y: 130, w: 180, h: 15, surface: 'sand' },
      { x: 230, y: 50,  w: 160, h: 15, surface: 'normal' },
      { x: 400, y: -30, w: 150, h: 15, surface: 'ice' },
      { x: 180, y: -110, w: 160, h: 15, surface: 'normal' },

      // Slime-Block Boost
      { x: 400, y: -170, w: 80, h: 10, surface: 'trampolin' },

      // Aufstieg Phase 2 – nach dem Boost
      { x: 180, y: -270, w: 160, h: 15, surface: 'normal' },
      { x: 400, y: -350, w: 150, h: 15, surface: 'normal' },
      { x: 180, y: -400, w: 160, h: 15, surface: 'ice' },

      // Gipfel – Creeper wartet!
      { x: 330, y: -480, w: 200, h: 15, surface: 'normal' },
    ],
    coins: [
      { x: 490, y: 265 },
      { x: 250, y: 185 },
      { x: 480, y: 105 },
      { x: 230, y: 25 },
      { x: 460, y: -55 },
      { x: 250, y: -135 },
      { x: 430, y: -195 },
      { x: 250, y: -295 },
      { x: 460, y: -375 },
      { x: 250, y: -455 },
      { x: 420, y: -505 },
    ],
    learnTriggers: [
      { x: 220, y: 20, w: 40, h: 40, factId: 'mc_gravity', triggered: false },
      { x: 410, y: -200, w: 40, h: 40, factId: 'mc_slime', triggered: false },
      { x: 190, y: -460, w: 40, h: 40, factId: 'mc_sand', triggered: false },
    ],
    goal: { x: 390, y: -510, w: 60, h: 30 },
    worldWidth: 800,
  },
];

export function loadLevel(id) {
  const levelData = LEVELS.find(l => l.id === id);
  if (!levelData) return null;

  // Tiefe Kopie, damit Trigger etc. zurückgesetzt werden
  return JSON.parse(JSON.stringify(levelData));
}

export function getTotalLevels() {
  return LEVELS.length;
}
