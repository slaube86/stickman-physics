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
    this.state = "idle"; // idle, run, jump, fall, kick

    // Kick-Animation
    this.kickTimer = 0;
  }

  update(keys, dt) {
    // Kick-Animation hat Vorrang vor allem anderen
    if (this.kickTimer > 0) {
      this.state = "kick";
      this.kickTimer--;
    } else if (!this.onGround) {
      // State bestimmen
      this.state = this.vy < 0 ? "jump" : "fall";
    } else if (Math.abs(this.vx) > 0.5) {
      this.state = "run";
    } else {
      this.state = "idle";
    }

    // Blickrichtung
    if (keys.left) this.facing = -1;
    if (keys.right) this.facing = 1;

    // Lauf-Animation
    if (this.state === "run") {
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

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const headRadius = 8;
    const bodyLength = 18;
    const limbLength = 14;

    // Kopf
    ctx.beginPath();
    ctx.arc(0, -this.h + headRadius, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Augen (einfache Punkte)
    ctx.fillStyle = "#ffffff";
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
    if (this.state === "kick") {
      // Linker Arm weit zurück für Balance, rechter leicht vorne
      return { left: -14, right: 4 };
    }
    if (this.state === "jump") {
      return { left: -8, right: -8 }; // Arme hoch
    }
    if (this.state === "run") {
      const swing = Math.sin((this.animFrame * Math.PI) / 2) * 6;
      return { left: swing, right: -swing };
    }
    return { left: 0, right: 0 };
  }

  _getLegSwing() {
    if (this.state === "kick") {
      // Roundhouse-Kick: rechtes Bein schwingt weit seitlich-hoch raus
      return { leftX: -3, leftY: 5, rightX: 22, rightY: -10 };
    }
    if (this.state === "jump") {
      return { leftX: -3, leftY: -4, rightX: 3, rightY: -4 };
    }
    if (this.state === "fall") {
      return { leftX: -4, leftY: 0, rightX: 4, rightY: 0 };
    }
    if (this.state === "run") {
      const swing = Math.sin((this.animFrame * Math.PI) / 2) * 8;
      return {
        leftX: swing,
        leftY: Math.abs(swing) * -0.3,
        rightX: -swing,
        rightY: Math.abs(swing) * -0.3,
      };
    }
    return { leftX: -4, leftY: 0, rightX: 4, rightY: 0 };
  }

  // Bounding-Box für Kollision
  getBounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  // Wall-E Modus zeichnen
  drawWallE(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h);
    ctx.scale(this.facing, 1);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Ketten/Räder (unten)
    const trackY = 0;
    const trackW = 14;
    const trackH = 6;
    // Linke Kette
    ctx.strokeRect(-trackW - 1, trackY - trackH, trackW, trackH);
    // Rechte Kette
    ctx.strokeRect(1, trackY - trackH, trackW, trackH);
    // Kettendetails
    for (let i = 0; i < 3; i++) {
      const offset = (this.animFrame * 3 + i * 4) % 12;
      ctx.beginPath();
      ctx.moveTo(-trackW + offset, trackY - trackH);
      ctx.lineTo(-trackW + offset, trackY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(1 + offset, trackY - trackH);
      ctx.lineTo(1 + offset, trackY);
      ctx.stroke();
    }

    // Körper (Würfel/Box)
    const bodyW = 22;
    const bodyH = 18;
    const bodyY = -trackH - bodyH;
    ctx.strokeRect(-bodyW / 2, bodyY, bodyW, bodyH);

    // Bauch-Detail (Müllklappe)
    ctx.beginPath();
    ctx.moveTo(-bodyW / 2 + 3, bodyY + bodyH / 2);
    ctx.lineTo(bodyW / 2 - 3, bodyY + bodyH / 2);
    ctx.stroke();

    // Hals
    const neckY = bodyY;
    ctx.beginPath();
    ctx.moveTo(0, neckY);
    ctx.lineTo(0, neckY - 6);
    ctx.stroke();

    // Augen (Fernglas-Stil)
    const eyeY = neckY - 12;
    const eyeR = 6;
    // Verbindungsstange
    ctx.beginPath();
    ctx.moveTo(-8, eyeY);
    ctx.lineTo(8, eyeY);
    ctx.stroke();
    // Linkes Auge
    ctx.beginPath();
    ctx.arc(-8, eyeY, eyeR, 0, Math.PI * 2);
    ctx.stroke();
    // Rechtes Auge
    ctx.beginPath();
    ctx.arc(8, eyeY, eyeR, 0, Math.PI * 2);
    ctx.stroke();
    // Pupillen
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-8, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Arme
    const armY = bodyY + 4;
    const armSwing = this._getArmSwing();
    // Linker Arm (Greifarm)
    ctx.beginPath();
    ctx.moveTo(-bodyW / 2, armY);
    ctx.lineTo(-bodyW / 2 - 6, armY + 10 + armSwing.left);
    ctx.lineTo(-bodyW / 2 - 3, armY + 14 + armSwing.left);
    ctx.stroke();
    // Rechter Arm (Greifarm)
    ctx.beginPath();
    ctx.moveTo(bodyW / 2, armY);
    ctx.lineTo(bodyW / 2 + 6, armY + 10 + armSwing.right);
    ctx.lineTo(bodyW / 2 + 3, armY + 14 + armSwing.right);
    ctx.stroke();

    ctx.restore();
  }

  // Minecraft Steve zeichnen (blocky pixel look)
  drawSteve(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h);
    ctx.scale(this.facing, 1);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";

    // Beine (2 Blöcke)
    const legSwing = this._getArmSwing();
    // Linkes Bein
    ctx.strokeRect(-7, -12 + legSwing.left * 0.3, 5, 12);
    // Rechtes Bein
    ctx.strokeRect(2, -12 + legSwing.right * 0.3, 5, 12);

    // Körper (Block)
    const bodyY = -32;
    ctx.strokeRect(-8, bodyY, 16, 20);
    // Körper-Detail (Gürtel)
    ctx.beginPath();
    ctx.moveTo(-8, bodyY + 16);
    ctx.lineTo(8, bodyY + 16);
    ctx.stroke();

    // Arme
    const armSwing = this._getArmSwing();
    // Linker Arm
    ctx.strokeRect(-13, bodyY + 1 + armSwing.left, 5, 14);
    // Rechter Arm
    ctx.strokeRect(8, bodyY + 1 + armSwing.right, 5, 14);

    // Kopf (größerer Block – Minecraft-typisch)
    const headY = bodyY - 14;
    ctx.strokeRect(-8, headY, 16, 14);

    // Augen (Pixel-Stil)
    ctx.fillStyle = "#fff";
    ctx.fillRect(-5, headY + 5, 3, 2);
    ctx.fillRect(2, headY + 5, 3, 2);

    // Mund
    ctx.beginPath();
    ctx.moveTo(-2, headY + 10);
    ctx.lineTo(2, headY + 10);
    ctx.stroke();

    // Haare (oberer Rand)
    ctx.beginPath();
    ctx.moveTo(-8, headY);
    ctx.lineTo(-8, headY - 2);
    ctx.lineTo(8, headY - 2);
    ctx.lineTo(8, headY);
    ctx.stroke();

    ctx.restore();
  }

  // Stickman mit Glashelm für Space-Level
  drawSpace(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h);
    ctx.scale(this.facing, 1);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const headRadius = 8;
    const bodyLength = 18;
    const limbLength = 14;

    // --- Stickman zuerst zeichnen ---
    // Kopf
    ctx.beginPath();
    ctx.arc(0, -this.h + headRadius, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Augen
    ctx.fillStyle = "#fff";
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
    ctx.beginPath();
    ctx.moveTo(0, armY);
    ctx.lineTo(-8, armY + limbLength + armSwing.left);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, armY);
    ctx.lineTo(8, armY + limbLength + armSwing.right);
    ctx.stroke();

    // Beine
    const legSwing = this._getLegSwing();
    ctx.beginPath();
    ctx.moveTo(0, bodyBottom);
    ctx.lineTo(-6 + legSwing.leftX, bodyBottom + limbLength + legSwing.leftY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, bodyBottom);
    ctx.lineTo(6 + legSwing.rightX, bodyBottom + limbLength + legSwing.rightY);
    ctx.stroke();

    // --- Glashelm darüber zeichnen ---
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#6cf";
    ctx.beginPath();
    ctx.arc(0, -this.h + headRadius, headRadius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // Ninja-Skin für das Ninjago-Level
  drawNinja(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h);
    ctx.scale(this.facing, 1);

    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const headRadius = 8;
    const bodyLength = 18;
    const limbLength = 14;
    const headCY = -this.h + headRadius; // = -40

    // Kopf
    ctx.beginPath();
    ctx.arc(0, headCY, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Ninja-Stirnband (dicker Bogen über den oberen Kopf)
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, headCY, headRadius + 1, -Math.PI * 0.85, -Math.PI * 0.15, false);
    ctx.stroke();
    ctx.lineWidth = 2.5;

    // Gesichtsmaske (horizontale Linie über den unteren Gesichtsbereich)
    ctx.beginPath();
    ctx.moveTo(-headRadius + 2, headCY + 3);
    ctx.lineTo(headRadius - 2, headCY + 3);
    ctx.stroke();

    // Auge (nur das rechte sichtbar)
    ctx.beginPath();
    ctx.arc(3, headCY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Rumpf
    const bodyTop = headCY + headRadius;
    const bodyBottom = bodyTop + bodyLength;
    ctx.beginPath();
    ctx.moveTo(0, bodyTop);
    ctx.lineTo(0, bodyBottom);
    ctx.stroke();

    // Katana auf dem Rücken (schräge Schwertlinie)
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, bodyTop - 1);
    ctx.lineTo(-12, bodyTop + 17);
    ctx.stroke();
    // Tsuba (Parierstange)
    ctx.beginPath();
    ctx.moveTo(-9, bodyTop + 7);
    ctx.lineTo(-4, bodyTop + 4);
    ctx.stroke();
    ctx.lineWidth = 2.5;

    // Arme
    const armY = bodyTop + 4;
    const armSwing = this._getArmSwing();
    ctx.beginPath();
    ctx.moveTo(0, armY);
    ctx.lineTo(-8, armY + limbLength + armSwing.left);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, armY);
    ctx.lineTo(8, armY + limbLength + armSwing.right);
    ctx.stroke();

    // Beine
    const legSwing = this._getLegSwing();
    ctx.beginPath();
    ctx.moveTo(0, bodyBottom);
    ctx.lineTo(-6 + legSwing.leftX, bodyBottom + limbLength + legSwing.leftY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, bodyBottom);
    ctx.lineTo(6 + legSwing.rightX, bodyBottom + limbLength + legSwing.rightY);
    ctx.stroke();

    ctx.restore();
  }
}
