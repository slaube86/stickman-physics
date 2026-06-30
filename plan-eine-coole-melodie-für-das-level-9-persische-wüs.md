# Plan: Persian Desert Level 9 Music

> **Scope:** 1 file · 5 steps · ~15 min

## Goal
Create a cool melody for the Persian Desert Level 9, enhancing the player's experience.

## Affected Files
- `modules/audio.js` — add new music code and modify existing scheduleBeats() function.

## Steps

### 1. Add Persian Desert Level 9 Music in modules/audio.js
**Find:** The existing scheduleBeats() function.
**Change:** Insert a new block of code to play the Persian Desert Level 9 music when beatNum % 4 === 0.

```js
// BEFORE (only if replacing existing code — show the exact current lines)
if (beatNum % 4 === 0) {
  // existing code...
}

// AFTER (the exact code to write — complete, copy-paste ready, no placeholders)
if (beatNum % 4 === 0) {
  const desertOsc = this.ctx.createOscillator();
  const desertEnv = this.ctx.createGain();
  desertOsc.type = "sine";
  desertOsc.frequency.setValueAtTime(120, t);
  desertOsc.frequency.exponentialRampToValueAtTime(80, t + 0.09);
  desertEnv.gain.setValueAtTime(0.5, t);
  desertEnv.gain.exponentialRampToValueAtTime(0.01, t + 0.11);
  desertOsc.connect(desertEnv);
  desertEnv.connect(this.musicGain);
  desertOsc.start(t);
  desertOsc.stop(t + 0.11);
  activeNodes.push(desertOsc);
}
```

### 2. Modify scheduleBeats() function in modules/audio.js
**Find:** The existing scheduleBeats() function.
**Change:** Update the function to include the new Persian Desert Level 9 music code.

```js
// BEFORE (only if replacing existing code — show the exact current lines)
function scheduleBeats() {
  // existing code...
}

// AFTER (the exact code to write — complete, copy-paste ready, no placeholders)
function scheduleBeats() {
  // existing code...
  if (beatNum % 4 === 0) {
    // new Persian Desert Level 9 music code...
  }
}
```

### 3. Add a new beat counter for the Persian Desert Level 9
**Find:** The existing beat counter initialization.
**Change:** Initialize a new beat counter for the Persian Desert Level 9.

```js
// BEFORE (only if replacing existing code — show the exact current lines)
let beatNum = 0;

// AFTER (the exact code to write — complete, copy-paste ready, no placeholders)
let desertBeatNum = 0;
```

### 4. Update the music scheduler in modules/audio.js
**Find:** The existing music scheduler.
**Change:** Update the scheduler to use the new Persian Desert Level 9 beat counter.

```js
// BEFORE (only if replacing existing code — show the exact current lines)
setInterval(scheduleBeats, 100);

// AFTER (the exact code to write — complete, copy-paste ready, no placeholders)
setInterval(() => {
  scheduleBeats();
  desertBeatNum++;
}, 100);
```

### 5. Verify the Persian Desert Level 9 Music
**Find:** The game.js file.
**Change:** Play the level and verify that the new music plays correctly when reaching the Persian Desert Level 9.

Verification:

1. Start the game and reach the Persian Desert Level 9.
2. Listen to the new music playing in the background.
3. Verify that the music starts and stops at the correct times, creating a cool and immersive experience for the player.

⚠️ **Watch out:** Make sure to test the music thoroughly to avoid any audio-related issues or bugs.

---
*Generated: 2026-05-07 20:26*
