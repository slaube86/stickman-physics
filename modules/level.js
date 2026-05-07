// level.js – Level-Daten und Welt-Scrolling

export const LEVELS = [
  // Level 1 – Tutorial: Laufen & Springen
  {
    id: 1,
    name: "Tutorial",
    theme: "normal",
    spawnX: 50,
    spawnY: 300,
    platforms: [
      // Boden
      { x: 0, y: 370, w: 300, h: 30, surface: "normal" },
      { x: 350, y: 370, w: 200, h: 30, surface: "normal" },
      { x: 600, y: 370, w: 400, h: 30, surface: "normal" },
      // Plattformen
      { x: 250, y: 300, w: 80, h: 15, surface: "normal" },
      { x: 450, y: 260, w: 80, h: 15, surface: "normal" },
      { x: 650, y: 300, w: 80, h: 15, surface: "normal" },
      // Höhere Plattformen
      { x: 800, y: 240, w: 100, h: 15, surface: "normal" },
      { x: 950, y: 310, w: 120, h: 15, surface: "normal" },
      // Boden weiter
      { x: 1050, y: 370, w: 400, h: 30, surface: "normal" },
      // Ziel-Plattform
      { x: 1350, y: 300, w: 80, h: 15, surface: "normal" },
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
      { x: 200, y: 340, w: 40, h: 40, factId: "gravity", triggered: false },
      {
        x: 450,
        y: 230,
        w: 40,
        h: 40,
        factId: "potential_energy",
        triggered: false,
      },
    ],
    goal: { x: 1360, y: 270, w: 60, h: 30 },
    worldWidth: 1500,
  },

  // Level 6 – Weltraum/Mond
  {
    id: 6,
    name: "Weltraum/Mond",
    theme: "space",
    spawnX: 100,
    spawnY: 300,
    gravity: 0.15, // sehr geringe Schwerkraft
    starField: { count: 80, minR: 0.5, maxR: 1.8 }, // für zufällige Sterne
    platforms: [
      // Startplattform (Mondboden)
      { x: 0, y: 370, w: 300, h: 30, surface: "normal" },
      // Schwebende Plattformen
      { x: 200, y: 270, w: 80, h: 15, surface: "normal" },
      { x: 350, y: 200, w: 80, h: 15, surface: "normal" },
      { x: 500, y: 130, w: 80, h: 15, surface: "normal" },
      { x: 650, y: 70, w: 80, h: 15, surface: "normal" },
      { x: 800, y: 120, w: 80, h: 15, surface: "normal" },
      { x: 950, y: 200, w: 80, h: 15, surface: "normal" },
      // Zielplattform (Mondbasis)
      { x: 1100, y: 270, w: 120, h: 20, surface: "normal" },
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
      {
        x: 120,
        y: 340,
        w: 40,
        h: 40,
        factId: "moon_gravity",
        triggered: false,
      },
      { x: 700, y: 40, w: 40, h: 40, factId: "space_jump", triggered: false },
    ],
    goal: { x: 1150, y: 240, w: 60, h: 30 },
    worldWidth: 1300,
    worldTop: -200, // vertikales Scrolling aktivieren
  },

  // Level 2 – Eishöhle
  {
    id: 2,
    name: "Eishöhle",
    theme: "ice",
    spawnX: 50,
    spawnY: 300,
    platforms: [
      // Startboden (normal)
      { x: 0, y: 370, w: 200, h: 30, surface: "normal" },
      // Eis-Boden
      { x: 250, y: 370, w: 300, h: 30, surface: "ice" },
      { x: 600, y: 370, w: 250, h: 30, surface: "ice" },
      // Eis-Plattformen
      { x: 350, y: 290, w: 90, h: 15, surface: "ice" },
      { x: 550, y: 250, w: 90, h: 15, surface: "ice" },
      // Sand-Bereich
      { x: 900, y: 370, w: 200, h: 30, surface: "sand" },
      { x: 950, y: 300, w: 80, h: 15, surface: "sand" },
      // Weiterer Boden
      { x: 1150, y: 370, w: 350, h: 30, surface: "normal" },
      // Trampolin!
      { x: 1250, y: 365, w: 60, h: 10, surface: "trampolin" },
      // Hohe Zielplattform
      { x: 1350, y: 240, w: 100, h: 15, surface: "normal" },
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
      { x: 300, y: 340, w: 40, h: 40, factId: "friction", triggered: false },
      { x: 930, y: 340, w: 40, h: 40, factId: "damping", triggered: false },
      { x: 1260, y: 330, w: 40, h: 40, factId: "elasticity", triggered: false },
    ],
    goal: { x: 1370, y: 210, w: 60, h: 30 },
    worldWidth: 1550,
  },

  // Level 3 – Sprungturm
  {
    id: 3,
    name: "Sprungturm",
    theme: "normal",
    spawnX: 50,
    spawnY: 300,
    platforms: [
      { x: 0, y: 370, w: 200, h: 30, surface: "normal" },
      { x: 150, y: 320, w: 80, h: 15, surface: "normal" },
      { x: 280, y: 270, w: 80, h: 15, surface: "normal" },
      { x: 400, y: 220, w: 80, h: 15, surface: "normal" },
      { x: 520, y: 170, w: 80, h: 15, surface: "normal" },
      { x: 650, y: 130, w: 100, h: 15, surface: "normal" },
      // Abstieg
      { x: 800, y: 180, w: 80, h: 15, surface: "normal" },
      { x: 920, y: 240, w: 80, h: 15, surface: "normal" },
      { x: 1040, y: 300, w: 80, h: 15, surface: "normal" },
      { x: 1150, y: 370, w: 300, h: 30, surface: "normal" },
      // Trampolin-Kette
      { x: 1200, y: 365, w: 50, h: 10, surface: "trampolin" },
      { x: 1350, y: 250, w: 80, h: 15, surface: "normal" },
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
      {
        x: 530,
        y: 140,
        w: 40,
        h: 40,
        factId: "potential_energy",
        triggered: false,
      },
      {
        x: 690,
        y: 100,
        w: 40,
        h: 40,
        factId: "kinetic_energy",
        triggered: false,
      },
    ],
    goal: { x: 1360, y: 220, w: 60, h: 30 },
    worldWidth: 1500,
  },

  // Level 4 – Wall-E findet Eve
  {
    id: 4,
    name: "Wall-E findet Eve",
    theme: "walle",
    spawnX: 50,
    spawnY: 300,
    platforms: [
      // Schrottplatz-Start
      { x: 0, y: 370, w: 250, h: 30, surface: "normal" },
      { x: 200, y: 320, w: 70, h: 15, surface: "normal" },
      { x: 320, y: 370, w: 150, h: 30, surface: "sand" },
      // Müllberge
      { x: 500, y: 340, w: 100, h: 30, surface: "normal" },
      { x: 550, y: 290, w: 70, h: 15, surface: "normal" },
      { x: 650, y: 370, w: 120, h: 30, surface: "normal" },
      // Trampolin-Sprungfeld (Wall-E Pressblock)
      { x: 800, y: 365, w: 60, h: 10, surface: "trampolin" },
      // Plattformen hoch zu Eve
      { x: 900, y: 300, w: 90, h: 15, surface: "normal" },
      { x: 1020, y: 370, w: 200, h: 30, surface: "normal" },
      { x: 1060, y: 310, w: 80, h: 15, surface: "normal" },
      // Eis-Rutsche (glatter Metall-Boden)
      { x: 1250, y: 370, w: 250, h: 30, surface: "ice" },
      { x: 1300, y: 310, w: 70, h: 15, surface: "ice" },
      // Letzter Sprung zu Eve
      { x: 1530, y: 370, w: 200, h: 30, surface: "normal" },
      { x: 1580, y: 310, w: 80, h: 15, surface: "normal" },
      { x: 1700, y: 280, w: 100, h: 15, surface: "normal" },
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
      {
        x: 340,
        y: 340,
        w: 40,
        h: 40,
        factId: "walle_energy",
        triggered: false,
      },
      { x: 810, y: 330, w: 40, h: 40, factId: "walle_solar", triggered: false },
      {
        x: 1270,
        y: 340,
        w: 40,
        h: 40,
        factId: "walle_friction_metal",
        triggered: false,
      },
    ],
    goal: { x: 1710, y: 250, w: 60, h: 30 },
    worldWidth: 1850,
  },

  // Level 5 – Minecraft: Turm nach oben
  {
    id: 5,
    name: "Minecraft Turm",
    theme: "minecraft",
    spawnX: 250,
    spawnY: 300,
    worldTop: -700,
    platforms: [
      // Gras-Boden
      { x: 100, y: 370, w: 600, h: 30, surface: "normal" },

      // Aufstieg Phase 1 – Blockstufen (zigzag, 80px Abstände)
      { x: 430, y: 290, w: 150, h: 15, surface: "normal" },
      { x: 180, y: 210, w: 160, h: 15, surface: "normal" },
      { x: 400, y: 130, w: 180, h: 15, surface: "sand" },
      { x: 230, y: 50, w: 160, h: 15, surface: "normal" },
      { x: 400, y: -30, w: 150, h: 15, surface: "ice" },
      { x: 180, y: -110, w: 160, h: 15, surface: "normal" },

      // Slime-Block Boost
      { x: 400, y: -170, w: 80, h: 10, surface: "trampolin" },

      // Aufstieg Phase 2 – nach dem Boost
      { x: 180, y: -270, w: 160, h: 15, surface: "normal" },
      { x: 400, y: -350, w: 150, h: 15, surface: "normal" },
      { x: 180, y: -400, w: 160, h: 15, surface: "ice" },

      // Gipfel – Creeper wartet!
      { x: 330, y: -480, w: 200, h: 15, surface: "normal" },
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
      { x: 220, y: 20, w: 40, h: 40, factId: "mc_gravity", triggered: false },
      { x: 410, y: -200, w: 40, h: 40, factId: "mc_slime", triggered: false },
      { x: 190, y: -460, w: 40, h: 40, factId: "mc_sand", triggered: false },
    ],
    goal: { x: 390, y: -510, w: 60, h: 30 },
    worldWidth: 800,
  },

  // Level 8 – Clockwork Cog
  {
    id: 8,
    name: "Clockwork Cog",
    theme: "clockwork",
    spawnX: 50,
    spawnY: 300,
    platforms: [
      // ─── Sektion 1: Eingang ─────────────────────────────────
      { x: 0,    y: 370, w: 250, h: 30, surface: "normal" },
      { x: 195,  y: 315, w: 80,  h: 15, surface: "normal" },
      { x: 320,  y: 370, w: 200, h: 30, surface: "normal" },
      // ─── Sektion 2: Getriebe-Kammer ─────────────────────────
      { x: 565,  y: 320, w: 80,  h: 15, surface: "normal" },
      { x: 690,  y: 265, w: 80,  h: 15, surface: "normal" },
      { x: 815,  y: 320, w: 80,  h: 15, surface: "normal" },
      { x: 940,  y: 370, w: 200, h: 30, surface: "normal" },
      { x: 970,  y: 365, w: 55,  h: 10, surface: "trampolin" },
      // ─── Sektion 3: Pendel-Halle ────────────────────────────
      { x: 1150, y: 305, w: 90,  h: 15, surface: "normal" },
      { x: 1330, y: 250, w: 80,  h: 15, surface: "normal" },
      { x: 1500, y: 305, w: 80,  h: 15, surface: "normal" },
      { x: 1625, y: 370, w: 180, h: 30, surface: "normal" },
      // ─── Sektion 4: Uhrzifferblatt (Eisplattformen) ─────────
      { x: 1660, y: 310, w: 90,  h: 15, surface: "ice" },
      { x: 1800, y: 255, w: 90,  h: 15, surface: "ice" },
      { x: 1940, y: 310, w: 90,  h: 15, surface: "ice" },
      // ─── Sektion 5: Meister-Zahnrad / Ziel ──────────────────
      { x: 2080, y: 370, w: 220, h: 30, surface: "sand" },
      { x: 2105, y: 305, w: 120, h: 15, surface: "normal" },
    ],
    coins: [
      { x: 237,  y: 290 },
      { x: 385,  y: 345 },
      { x: 605,  y: 295 },
      { x: 730,  y: 240 },
      { x: 855,  y: 295 },
      { x: 997,  y: 340 },
      { x: 1195, y: 280 },
      { x: 1370, y: 225 },
      { x: 1540, y: 280 },
      { x: 1705, y: 285 },
      { x: 1845, y: 230 },
      { x: 1985, y: 285 },
      { x: 2165, y: 280 },
    ],
    learnTriggers: [
      { x: 600,  y: 290, w: 40, h: 40, factId: "cw_rotation",   triggered: false },
      { x: 1350, y: 220, w: 40, h: 40, factId: "cw_pendulum",   triggered: false },
      { x: 1680, y: 280, w: 40, h: 40, factId: "cw_gear_ratio", triggered: false },
    ],
    goal: { x: 2135, y: 275, w: 60, h: 30 },
    worldWidth: 2350,
    enemies: [
      { x: 820,  platformY: 320, patrolLeft: 820,  patrolRight: 890,  speed: 1.5 },
      { x: 960,  platformY: 370, patrolLeft: 945,  patrolRight: 1130, speed: 1.8 },
      { x: 1160, platformY: 305, patrolLeft: 1155, patrolRight: 1235, speed: 1.4 },
      { x: 1340, platformY: 250, patrolLeft: 1335, patrolRight: 1405, speed: 1.7 },
      { x: 2090, platformY: 370, patrolLeft: 2085, patrolRight: 2290, speed: 2.0 },
      { x: 2115, platformY: 305, patrolLeft: 2110, patrolRight: 2220, speed: 1.5 },
    ],
  },

  // Level 9 – Persische Wüste
  {
    id: 9,
    name: "Persische Wüste",
    theme: "desert",
    spawnX: 50,
    spawnY: 300,
    platforms: [
      // ─── Sektion 1: Sanddünen-Start ─────────────────────────
      { x: 0,    y: 370, w: 220, h: 30, surface: "sand" },
      { x: 255,  y: 340, w: 100, h: 15, surface: "sand" },
      { x: 400,  y: 370, w: 160, h: 30, surface: "sand" },
      // ─── Sektion 2: Felsoase ─────────────────────────────────
      { x: 600,  y: 295, w: 90,  h: 15, surface: "normal" },
      { x: 730,  y: 230, w: 80,  h: 15, surface: "normal" },
      { x: 860,  y: 370, w: 145, h: 30, surface: "sand" },
      // ─── Sektion 3: Tiefe Wüste ──────────────────────────────
      { x: 870,  y: 365, w: 55,  h: 10, surface: "trampolin" },
      { x: 1060, y: 295, w: 90,  h: 15, surface: "sand" },
      { x: 1200, y: 370, w: 355, h: 30, surface: "sand" },
      // ─── Sektion 4: Persisches Tor ───────────────────────────
      { x: 1255, y: 365, w: 55,  h: 10, surface: "trampolin" },
      { x: 1380, y: 245, w: 100, h: 15, surface: "normal" },
      { x: 1530, y: 305, w: 120, h: 15, surface: "sand" },
    ],
    coins: [
      { x: 295, y: 315 },
      { x: 470, y: 345 },
      { x: 635, y: 270 },
      { x: 760, y: 205 },
      { x: 905, y: 340 },
      { x: 1100, y: 270 },
      { x: 1245, y: 345 },
      { x: 1300, y: 335 },
      { x: 1420, y: 220 },
      { x: 1565, y: 280 },
    ],
    learnTriggers: [
      { x: 450,  y: 340, w: 40, h: 40, factId: "desert_sand",  triggered: false },
      { x: 740,  y: 200, w: 40, h: 40, factId: "desert_heat",  triggered: false },
      { x: 880,  y: 330, w: 40, h: 40, factId: "desert_oasis", triggered: false },
    ],
    goal: { x: 1550, y: 275, w: 60, h: 30 },
    worldWidth: 1700,
    enemies: [
      { x: 280,  platformY: 340, patrolLeft: 258,  patrolRight: 350,  speed: 1.3 },
      { x: 870,  platformY: 370, patrolLeft: 865,  patrolRight: 1000, speed: 1.5 },
      { x: 1070, platformY: 295, patrolLeft: 1063, patrolRight: 1145, speed: 1.2 },
      { x: 1215, platformY: 370, patrolLeft: 1203, patrolRight: 1550, speed: 1.7 },
    ],
  },

  // Level 7 – Ninjago Tempel
  {
    id: 7,
    name: "Ninjago Tempel",
    theme: "ninjago",
    spawnX: 50,
    spawnY: 300,
    platforms: [
      // Dojo-Eingang (Startplattform)
      { x: 0, y: 370, w: 240, h: 30, surface: "normal" },
      // Pagodenstufen (erste Etappe)
      { x: 285, y: 320, w: 80, h: 15, surface: "normal" },
      { x: 390, y: 270, w: 90, h: 15, surface: "normal" },
      // Gefrorener Tempelteich (Eis – rutschig!)
      { x: 500, y: 370, w: 230, h: 30, surface: "ice" },
      { x: 550, y: 285, w: 90, h: 15, surface: "ice" },
      // Ninja-Trainingsgelände (Sand – hohe Reibung)
      { x: 760, y: 370, w: 270, h: 30, surface: "sand" },
      { x: 800, y: 300, w: 80, h: 15, surface: "sand" },
      // Boden zum Tempelaufstieg (normal)
      { x: 1080, y: 370, w: 630, h: 30, surface: "normal" },
      // Spinjitzu-Pad 1 (Trampolin)
      { x: 1110, y: 365, w: 55, h: 10, surface: "trampolin" },
      // Pagodendächer (Dachsprünge hoch zum Gipfel)
      { x: 1220, y: 305, w: 100, h: 15, surface: "normal" },
      { x: 1380, y: 245, w: 100, h: 15, surface: "normal" },
      { x: 1540, y: 305, w: 100, h: 15, surface: "normal" },
      // Spinjitzu-Pad 2 (Trampolin – letzter Boost)
      { x: 1660, y: 365, w: 55, h: 10, surface: "trampolin" },
      // Tempelgipfel – Sensei Wu wartet!
      { x: 1730, y: 265, w: 160, h: 15, surface: "normal" },
    ],
    coins: [
      { x: 325, y: 295 },
      { x: 430, y: 245 },
      { x: 592, y: 260 },
      { x: 840, y: 275 },
      { x: 1010, y: 345 },
      { x: 1135, y: 340 },
      { x: 1265, y: 280 },
      { x: 1425, y: 220 },
      { x: 1585, y: 280 },
      { x: 1760, y: 240 },
      { x: 1830, y: 240 },
    ],
    learnTriggers: [
      { x: 570, y: 250, w: 40, h: 40, factId: "ninjago_ice", triggered: false },
      {
        x: 820,
        y: 265,
        w: 40,
        h: 40,
        factId: "ninjago_training",
        triggered: false,
      },
      {
        x: 1120,
        y: 330,
        w: 40,
        h: 40,
        factId: "ninjago_spin",
        triggered: false,
      },
    ],
    goal: { x: 1760, y: 233, w: 60, h: 32 },
    worldWidth: 1950,
    enemies: [
      // Dojo-Wächter (Startbereich)
      { x: 110, platformY: 370, patrolLeft: 20, patrolRight: 215, speed: 1.2 },
      // Eisteich-Wächter (rutschige Verfolgung)
      { x: 600, platformY: 370, patrolLeft: 510, patrolRight: 710, speed: 1.4 },
      // Trainingsgelände-Wächter (Sand-Plattform)
      { x: 830, platformY: 300, patrolLeft: 805, patrolRight: 875, speed: 0.9 },
      // Pagodendach 1
      {
        x: 1265,
        platformY: 305,
        patrolLeft: 1225,
        patrolRight: 1315,
        speed: 1.3,
      },
      // Pagodendach 2 (höchstes Dach)
      {
        x: 1430,
        platformY: 245,
        patrolLeft: 1385,
        patrolRight: 1475,
        speed: 1.1,
      },
      // Tempelgipfel-Wächter (letzter Kampf vor Sensei Wu)
      {
        x: 1800,
        platformY: 265,
        patrolLeft: 1735,
        patrolRight: 1885,
        speed: 1.5,
      },
    ],
  },
];

export function loadLevel(id) {
  const levelData = LEVELS.find((l) => l.id === id);
  if (!levelData) return null;

  // Tiefe Kopie, damit Trigger etc. zurückgesetzt werden
  return JSON.parse(JSON.stringify(levelData));
}

export function getTotalLevels() {
  return LEVELS.length;
}
