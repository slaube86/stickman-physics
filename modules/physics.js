// physics.js – Physik-Engine: Schwerkraft, Reibung, Kollision

export const GRAVITY = 0.5;
export const JUMP_FORCE = -11;
export const MAX_SPEED = 5;
export const ACCELERATION = 0.6;

// Reibungswerte je Untergrund
export const SURFACES = {
  normal:    { friction: 0.85, label: 'Normal' },
  ice:       { friction: 0.98, label: 'Eis' },
  sand:      { friction: 0.60, label: 'Sand' },
  trampolin: { friction: 0.85, bounce: 1.3, label: 'Trampolin' }
};

export function applyGravity(player) {
  player.vy += GRAVITY;
}

export function applyMovement(player, keys) {
  if (keys.left) {
    player.vx -= ACCELERATION;
  }
  if (keys.right) {
    player.vx += ACCELERATION;
  }

  // Geschwindigkeit begrenzen
  if (player.vx > MAX_SPEED) player.vx = MAX_SPEED;
  if (player.vx < -MAX_SPEED) player.vx = -MAX_SPEED;
}

export function applyFriction(player, surface = SURFACES.normal) {
  if (player.onGround) {
    player.vx *= surface.friction;
    // Sehr kleine Geschwindigkeiten auf 0 setzen
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }
}

export function applyPosition(player) {
  player.x += player.vx;
  player.y += player.vy;
}

/**
 * AABB-Kollisionserkennung und -auflösung
 * Gibt ein Array von Events zurück (z.B. "landed", "bounce")
 */
export function resolveCollisions(player, platforms) {
  const events = [];
  player.onGround = false;

  for (const plat of platforms) {
    if (!aabbCheck(player.getBounds(), plat)) continue;

    const pb = player.getBounds();

    // Überlappung berechnen
    const overlapLeft   = (pb.x + pb.w) - plat.x;
    const overlapRight  = (plat.x + plat.w) - pb.x;
    const overlapTop    = (pb.y + pb.h) - plat.y;
    const overlapBottom = (plat.y + plat.h) - pb.y;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapY < minOverlapX) {
      // Vertikale Kollision
      if (overlapTop < overlapBottom) {
        // Von oben – Landung
        player.y = plat.y - player.h;
        if (plat.surface === 'trampolin' && player.vy > 2) {
          const bounce = SURFACES.trampolin.bounce || 1.3;
          player.vy = -player.vy * bounce;
          events.push({ type: 'bounce', platform: plat });
        } else {
          player.vy = 0;
          player.onGround = true;
          events.push({ type: 'landed', platform: plat });
        }
      } else {
        // Von unten – Kopf gestoßen
        player.y = plat.y + plat.h;
        player.vy = 0;
      }
    } else {
      // Horizontale Kollision
      if (overlapLeft < overlapRight) {
        player.x = plat.x - player.w;
      } else {
        player.x = plat.x + plat.w;
      }
      player.vx = 0;
      events.push({ type: 'wall_hit', platform: plat });
    }
  }

  return events;
}

function aabbCheck(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Kinetische Energie berechnen (für Anzeige)
 */
export function kineticEnergy(mass, vx, vy) {
  const v = Math.sqrt(vx * vx + vy * vy);
  return 0.5 * mass * v * v;
}

/**
 * Potenzielle Energie: E = m * g * h
 */
export function potentialEnergy(mass, height) {
  return mass * GRAVITY * Math.max(0, height);
}

/**
 * Gibt den Oberflächen-Typ der Plattform zurück, auf der der Spieler steht
 */
export function getCurrentSurface(player, platforms) {
  for (const plat of platforms) {
    // Prüfe ob Spieler direkt auf dieser Plattform steht
    if (
      player.onGround &&
      player.x + player.w > plat.x &&
      player.x < plat.x + plat.w &&
      Math.abs((player.y + player.h) - plat.y) < 2
    ) {
      return SURFACES[plat.surface] || SURFACES.normal;
    }
  }
  return SURFACES.normal;
}
