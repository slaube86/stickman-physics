# Plan: Persian Desert Level

## Goal
Create a new level in a Persian style, set in a desert with camels, sand dunes, and an oasis. The player must navigate through the desert to reach the Great Persian Gulf.

## Context
The project already has a 2D physics platformer built with vanilla JavaScript + ES modules. We have existing code for game logic, level loading, tile maps, platforms, enemies, HUD, menus, score, and sound effects.

## Affected Files

* `game.js`
* `modules/level.js`
* `modules/ui.js`

## Implementation Steps

### Step 1: Create the Persian Desert Level

**File:** `modules/level.js`
**Location:** `createLevel()` function
**Action:** Add a new level configuration for the Persian Desert level, including tile maps, platforms, and enemies.

```js
// ...

const persianDesertLevel = {
  // ...
  tiles: [
    { x: 0, y: 0, type: 'sand' },
    { x: 1, y: 0, type: 'sand' },
    { x: 2, y: 0, type: 'sand' },
    // ...
  ],
  platforms: [
    { x: 0, y: 10, w: 3, h: 5 }, // sand dune
    { x: 1, y: 15, w: 2, h: 4 }, // sand dune
    // ...
  ],
  enemies: [
    { type: 'scorpion', x: 0, y: 20 },
    { type: 'scorpion', x: 2, y: 25 },
    // ...
  ],
};

// ...

```

### Step 2: Add Persian Desert Background

**File:** `modules/ui.js`
**Location:** `drawBackground()` function
**Action:** Modify the background drawing code to include a Persian desert theme.

```js
// ...

if (theme === 'persianDesert') {
  ctx.fillStyle = '#F5DEB3'; // sandy beige color
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Add palm trees and other desert features
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * GAME_W;
    const y = Math.random() * GAME_H;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#8B4513'; // brown color
    ctx.fill();
  }
}

// ...

```

### Step 3: Add Camels and Other Desert Creatures

**File:** `modules/level.js`
**Location:** `createLevel()` function
**Action:** Add camels and other desert creatures to the level configuration.

```js
// ...

const persianDesertLevel = {
  // ...
  entities: [
    { type: 'camel', x: 0, y: 10 },
    { type: 'oasis', x: 2, y: 15 },
    { type: 'scorpion', x: 1, y: 20 },
    // ...
  ],
};

// ...

```

### Step 4: Add Persian Gulf Goal

**File:** `modules/level.js`
**Location:** `createLevel()` function
**Action:** Add the Great Persian Gulf as the goal for the level.

```js
// ...

const persianDesertLevel = {
  // ...
  goals: [
    { type: 'persianGulf', x: GAME_W - 100, y: GAME_H - 50 },
  ],
};

// ...

```

### Step 5: Update Game Logic

**File:** `game.js`
**Location:** `update()` function
**Action:** Modify the game logic to handle the new level and its features.

```js
// ...

if (level.theme === 'persianDesert') {
  // Handle camels, oasis, and scorpions
  for (const entity of level.entities) {
    if (entity.type === 'camel' && player.x + player.w / 2 > entity.x && player.y + player.h / 2 > entity.y) {
      // Camel animation and interaction logic
    }
    if (entity.type === 'oasis' && player.x + player.w / 2 > entity.x && player.y + player.h / 2 > entity.y) {
      // Oasis animation and interaction logic
    }
    if (entity.type === 'scorpion' && player.x + player.w / 2 > entity.x && player.y + player.h / 2 > entity.y) {
      // Scorpion attack and defense logic
    }
  }

  // Check for Persian Gulf goal
  if (player.x + player.w / 2 > persianGulfGoal.x && player.y + player.h / 2 > persianGulfGoal.y) {
    // Level completion logic
  }
}

// ...

```

## Edge Cases & Risks

* Ensure that the level design and game logic are balanced to provide a fun and challenging experience for players.
* Test the level thoroughly to ensure that all features, including camels, oasis, scorpions, and Persian Gulf goal, work as intended.

## How to Verify

1. Run the game with the new Persian Desert level and verify that the background, entities, and goals are displayed correctly.
2. Test the game logic by playing through the level and ensuring that the camel, oasis, and scorpion interactions work as expected.
3. Check for any bugs or issues that may have been introduced during the implementation process.

By following these steps and considering edge cases and risks, we can successfully implement a new Persian Desert level in our 2D physics platformer game.

---
*Generated: 2026-05-06 22:21*
