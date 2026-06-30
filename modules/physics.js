// physics.js – Physik-Engine: Schwerkraft, Reibung, Kollision

export const DEFAULT_GRAVITY = 0.5;
export const JUMP_FORCE = -9.5;
export const MAX_SPEED = 3.5;
export const ACCELERATION = 0.7;

// Reibungswerte je Untergrund
export const SURFACES = {
  normal:    { friction: 0.70, label: 'Normal' },
  ice:       { friction: 0.98, label: 'Eis' },
  sand:      { friction: 0.60, label: 'Sand' },
  trampolin: { friction: 0.70, bounce: 1.3, label: 'Trampolin' }
};

export function applyGravity(player, gravity = DEFAULT_GRAVITY) {
  player.vy += gravity;
}

// Geschwindigkeit nur beim aktiven Tastendruck begrenzen –
// physikalisch erzeugter Schwung (Halfpipe) bleibt erhalten.
export function applyMovement(player, keys) {
  if (keys.left) {
    player.vx -= ACCELERATION;
    if (player.vx < -MAX_SPEED) player.vx = -MAX_SPEED;
  }
  if (keys.right) {
    player.vx += ACCELERATION;
    if (player.vx > MAX_SPEED) player.vx = MAX_SPEED;
  }
}

export function applyFriction(player, surface = SURFACES.normal) {
  if (!player.onGround) return;
  const f = surface.friction;
  if (player._onSlope) {
    // Auf Schrägen: Reibung auf beide Komponenten (korrekte Physik)
    player.vx *= f;
    player.vy *= f;
  } else {
    player.vx *= f;
    if (Math.abs(player.vx) < 0.3) player.vx = 0;
  }
}

export function applyPosition(player) {
  player.x += player.vx;
  player.y += player.vy;
}

// ─── Interne Hilfsfunktion: AABB für Schrägplattformen ──────
function _slopeAABB(plat) {
  const y0 = plat.y;
  const y1 = plat.y + plat.slope * plat.w;
  const minY = Math.min(y0, y1);
  return { x: plat.x, y: minY, w: plat.w, h: Math.abs(y0 - y1) + 28 };
}

/**
 * AABB-Kollisionserkennung und -auflösung
 * Unterstützt jetzt auch Schrägplattformen mit `slope`-Eigenschaft.
 */
export function resolveCollisions(player, platforms) {
  const events = [];
  player.onGround = false;
  player._onSlope  = null;
  player._slopeAngle = 0;

  for (const plat of platforms) {
    // ── Schrägplattform ──────────────────────────────────────
    if (plat.slope !== undefined) {
      if (!aabbCheck(player.getBounds(), _slopeAABB(plat))) continue;

      const pb  = player.getBounds();
      const pcx = Math.max(plat.x, Math.min(plat.x + plat.w, pb.x + pb.w / 2));
      if (pcx < plat.x || pcx > plat.x + plat.w) continue;

      const surfY       = plat.y + plat.slope * (pcx - plat.x);
      const playerBottom = pb.y + pb.h;
      const margin      = 15 + Math.abs(player.vy);

      if (playerBottom >= surfY && playerBottom <= surfY + margin && player.vy >= -1) {
        player.y = surfY - player.h;

        // Geschwindigkeit entlang der Neigungstangente umlenken
        const s   = plat.slope;
        const mag = Math.sqrt(1 + s * s);
        const tx  = 1 / mag;
        const ty  = s / mag;
        const vt  = player.vx * tx + player.vy * ty;
        player.vx = vt * tx;
        player.vy = vt * ty;

        player.onGround  = true;
        player._onSlope  = plat;
        player._slopeAngle = Math.atan2(s, 1);
        events.push({ type: 'landed', platform: plat });
      }
      continue;
    }

    // ── Normale AABB-Plattform ───────────────────────────────
    if (!aabbCheck(player.getBounds(), plat)) continue;

    const pb = player.getBounds();

    const overlapLeft   = (pb.x + pb.w) - plat.x;
    const overlapRight  = (plat.x + plat.w) - pb.x;
    const overlapTop    = (pb.y + pb.h) - plat.y;
    const overlapBottom = (plat.y + plat.h) - pb.y;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapY < minOverlapX) {
      if (overlapTop < overlapBottom) {
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
        player.y = plat.y + plat.h;
        player.vy = 0;
      }
    } else {
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

export function kineticEnergy(mass, vx, vy) {
  const v = Math.sqrt(vx * vx + vy * vy);
  return 0.5 * mass * v * v;
}

export function potentialEnergy(mass, height, gravity = DEFAULT_GRAVITY) {
  return mass * gravity * Math.max(0, height);
}

export function getCurrentSurface(player, platforms) {
  for (const plat of platforms) {
    if (!player.onGround) continue;

    if (plat.slope !== undefined) {
      const pcx = player.x + player.w / 2;
      if (pcx < plat.x || pcx > plat.x + plat.w) continue;
      const surfY = plat.y + plat.slope * (pcx - plat.x);
      if (Math.abs((player.y + player.h) - surfY) < 6) {
        return SURFACES[plat.surface] || SURFACES.normal;
      }
    } else {
      if (
        player.x + player.w > plat.x &&
        player.x < plat.x + plat.w &&
        Math.abs((player.y + player.h) - plat.y) < 2
      ) {
        return SURFACES[plat.surface] || SURFACES.normal;
      }
    }
  }
  return SURFACES.normal;
}
