# Stickman Physics – Jump & Run

A kid-friendly jump & run game featuring a stickman character that teaches physics concepts through gameplay. Built with vanilla JavaScript and HTML5 Canvas.

## Play

Open `index.html` in a browser or serve locally:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Controls

| Input | Action |
|---|---|
| ← → / A D | Move left / right |
| ↑ / W / Space | Jump |
| R | Full reset (back to Level 1) |
| Enter / Click | Start / Restart |

Touch controls are shown automatically on mobile devices.

## Features

- **Stickman** with animated walk, jump, and fall states
- **Physics engine** with gravity, friction, AABB collision, and trampoline bounce
- **3 Levels** with different surfaces:
  - Normal ground
  - Ice (low friction – dashed line)
  - Sand (high friction – dotted line)
  - Trampoline (elastic bounce – zigzag line)
- **Learning cards** triggered by gameplay actions, explaining physics concepts like gravity, friction, kinetic/potential energy, elasticity, and Newton's 3rd law
- **Text-to-speech** – each learning card has a play button to read the explanation aloud (German, Web Speech API)
- **Coins** to collect for bonus points
- **Score system** with localStorage persistence
- **Minimalist black & white art style** – platforms and objects rendered as thin lines

## Project Structure

```
├── index.html          # Canvas, HUD, overlays, touch controls
├── style.css           # Black & white minimal styling
├── game.js             # Game loop, input, camera, state management
└── modules/
    ├── stickman.js     # Stickman drawing & animation
    ├── physics.js      # Gravity, friction, collision, energy
    ├── level.js        # Level data (platforms, coins, triggers, goals)
    ├── ui.js           # Rendering (background, platforms, coins, goal)
    └── learn.js        # Physics facts & speech synthesis
```

## Tech Stack

- Vanilla JavaScript (ES Modules)
- HTML5 Canvas API
- Web Speech API (text-to-speech)
- No dependencies