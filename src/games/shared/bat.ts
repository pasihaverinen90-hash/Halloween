/*
 * Drawings used by more than one game. No Phaser import: scripts/kuvalista.ts
 * reads the asset files that use these.
 */

/** A bat flying towards the viewer, wings spread (drawn in an 84 × 56 box, scaled to w × h). */
export function drawBat(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 84, h / 56);
  // Cold oval glow so the dark bat stands out against the night sky (fades out inside the picture)
  ctx.save();
  ctx.translate(42, 28);
  ctx.scale(1.5, 1);
  const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 27);
  glow.addColorStop(0, 'rgba(200, 140, 255, 0.4)');
  glow.addColorStop(1, 'rgba(200, 140, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-28, -28, 56, 56);
  ctx.restore();
  // Wings with scalloped lower edges
  ctx.beginPath();
  ctx.moveTo(42, 22);
  ctx.quadraticCurveTo(26, 4, 3, 10);
  ctx.quadraticCurveTo(10, 22, 5, 36);
  ctx.quadraticCurveTo(14, 29, 19, 39);
  ctx.quadraticCurveTo(25, 31, 31, 42);
  ctx.quadraticCurveTo(36, 36, 42, 44);
  ctx.quadraticCurveTo(48, 36, 53, 42);
  ctx.quadraticCurveTo(59, 31, 65, 39);
  ctx.quadraticCurveTo(70, 29, 79, 36);
  ctx.quadraticCurveTo(74, 22, 81, 10);
  ctx.quadraticCurveTo(58, 4, 42, 22);
  ctx.closePath();
  ctx.fillStyle = '#2b1842';
  ctx.fill();
  ctx.strokeStyle = '#a996e0';
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // Wing bones
  ctx.strokeStyle = '#140b20';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of [
    [40, 24, 5, 12],
    [38, 27, 19, 38],
    [38, 29, 31, 41],
    [44, 24, 79, 12],
    [46, 27, 65, 38],
    [46, 29, 53, 41],
  ]) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  // Body, head and ears
  ctx.fillStyle = '#120a1c';
  ctx.beginPath();
  ctx.ellipse(42, 32, 7, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(42, 21, 7, 0, Math.PI * 2);
  ctx.moveTo(36, 18);
  ctx.lineTo(35, 9);
  ctx.lineTo(40, 15);
  ctx.moveTo(48, 18);
  ctx.lineTo(49, 9);
  ctx.lineTo(44, 15);
  ctx.fill();
  // Glowing eyes
  ctx.fillStyle = '#ff7a3d';
  for (const ex of [39.5, 44.5]) {
    ctx.beginPath();
    ctx.arc(ex, 21, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
