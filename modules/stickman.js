// stickman.js – Zeichnet und animiert den Stickman

export class Stickman {
  constructor(x, y) {
    // Position & Größe
    this.x = x;
    this.y = y;
    this.w = 24;
    this.h = 48;

    // Physik
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1; // 1 = rechts, -1 = links

    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    this.state = 'idle'; // idle, run, jump, fall
  }

  update(keys, dt) {
    // State bestimmen
    if (!this.onGround) {
      this.state = this.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.vx) > 0.5) {
      this.state = 'run';
    } else {
      this.state = 'idle';
    }

    // Blickrichtung
    if (keys.left) this.facing = -1;
    if (keys.right) this.facing = 1;

    // Lauf-Animation
    if (this.state === 'run') {
      this.animTimer += dt;
      if (this.animTimer > 100) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h);
    ctx.scale(this.facing, 1);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const headRadius = 8;
    const bodyLength = 18;
    const limbLength = 14;

    // Kopf
    ctx.beginPath();
    ctx.arc(0, -this.h + headRadius, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Augen (einfache Punkte)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3, -this.h + headRadius - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Rumpf
    const bodyTop = -this.h + headRadius * 2;
    const bodyBottom = bodyTop + bodyLength;
    ctx.beginPath();
    ctx.moveTo(0, bodyTop);
    ctx.lineTo(0, bodyBottom);
    ctx.stroke();

    // Arme
    const armY = bodyTop + 4;
    const armSwing = this._getArmSwing();
    // Linker Arm
    ctx.beginPath();
    ctx.moveTo(0, armY);
    ctx.lineTo(-8, armY + limbLength + armSwing.left);
    ctx.stroke();
    // Rechter Arm
    ctx.beginPath();
    ctx.moveTo(0, armY);
    ctx.lineTo(8, armY + limbLength + armSwing.right);
    ctx.stroke();

    // Beine
    const legSwing = this._getLegSwing();
    // Linkes Bein
    ctx.beginPath();
    ctx.moveTo(0, bodyBottom);
    ctx.lineTo(-6 + legSwing.leftX, bodyBottom + limbLength + legSwing.leftY);
    ctx.stroke();
    // Rechtes Bein
    ctx.beginPath();
    ctx.moveTo(0, bodyBottom);
    ctx.lineTo(6 + legSwing.rightX, bodyBottom + limbLength + legSwing.rightY);
    ctx.stroke();

    ctx.restore();
  }

  _getArmSwing() {
    if (this.state === 'jump') {
      return { left: -8, right: -8 }; // Arme hoch
    }
    if (this.state === 'run') {
      const swing = Math.sin(this.animFrame * Math.PI / 2) * 6;
      return { left: swing, right: -swing };
    }
    return { left: 0, right: 0 };
  }

  _getLegSwing() {
    if (this.state === 'jump') {
      return { leftX: -3, leftY: -4, rightX: 3, rightY: -4 };
    }
    if (this.state === 'fall') {
      return { leftX: -4, leftY: 0, rightX: 4, rightY: 0 };
    }
    if (this.state === 'run') {
      const swing = Math.sin(this.animFrame * Math.PI / 2) * 8;
      return {
        leftX: swing, leftY: Math.abs(swing) * -0.3,
        rightX: -swing, rightY: Math.abs(swing) * -0.3
      };
    }
    return { leftX: -4, leftY: 0, rightX: 4, rightY: 0 };
  }

  // Bounding-Box für Kollision
  getBounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
