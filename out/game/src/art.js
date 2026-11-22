// Blueprint drawing primitives: cream grid paper, ink strokes, hatching, dimensions and stamps.
import { CANVAS, FONT, INK, INK_FAINT, INK_GHOST, PAPER, PALETTE, TITLE_BLOCK_LINES } from './config.js';

export function paper(ctx) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, CANVAS.w, CANVAS.h);
  ctx.lineWidth = 1;
  ctx.strokeStyle = INK_GHOST;
  ctx.beginPath();
  for (let x = 0; x <= CANVAS.w; x += 24) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, CANVAS.h);
  }
  for (let y = 0; y <= CANVAS.h; y += 24) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(CANVAS.w, y + 0.5);
  }
  ctx.stroke();
  ctx.strokeStyle = INK_FAINT;
  ctx.beginPath();
  for (let x = 0; x <= CANVAS.w; x += 120) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, CANVAS.h);
  }
  for (let y = 0; y <= CANVAS.h; y += 120) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(CANVAS.w, y + 0.5);
  }
  ctx.stroke();
}

export function line(ctx, x1, y1, x2, y2, color = INK, width = 1.5, dash = null) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function outline(ctx, r, color = INK, width = 1.8, dash = null) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash || []);
  ctx.lineJoin = 'round';
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

export function hatchRect(ctx, r, color = INK_FAINT, spacing = 8, dir = -1) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const span = r.w + r.h;
  for (let k = -span; k < span; k += spacing) {
    if (dir > 0) {
      ctx.moveTo(r.x + k, r.y);
      ctx.lineTo(r.x + k + r.h, r.y + r.h);
    } else {
      ctx.moveTo(r.x + k, r.y + r.h);
      ctx.lineTo(r.x + k + r.h, r.y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

export function hatchPolygon(ctx, points, color, spacing = 9) {
  if (points.length < 3) return;
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const span = maxX - minX + maxY - minY;
  for (let k = -span; k < span; k += spacing) {
    ctx.moveTo(minX + k, maxY);
    ctx.lineTo(minX + k + (maxY - minY), minY);
  }
  ctx.stroke();
  ctx.restore();
}

export function circle(ctx, x, y, r, color = INK, width = 1.5, fill = null, dash = null) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

export function text(ctx, value, x, y, size = 12, color = INK, align = 'left', weight = 'normal') {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
  ctx.restore();
}

export function measure(ctx, value, size = 12, weight = 'normal') {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  const width = ctx.measureText(value).width;
  ctx.restore();
  return width;
}

export function dimension(ctx, x1, y1, x2, y2, label, offset = 0) {
  const horizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
  const dx = horizontal ? 0 : Math.sign(x2 - x1) * offset;
  const dy = horizontal ? Math.sign(y2 - y1) * offset : 0;
  line(ctx, x1 + dx, y1 + dy, x2 + dx, y2 + dy, INK_FAINT, 1, [4, 3]);
  const tick = 5;
  if (horizontal) {
    line(ctx, x1 + dx, y1 + dy - tick, x1 + dx, y1 + dy + tick, INK_FAINT, 1);
    line(ctx, x2 + dx, y2 + dy - tick, x2 + dx, y2 + dy + tick, INK_FAINT, 1);
  } else {
    line(ctx, x1 + dx - tick, y1 + dy, x1 + dx + tick, y1 + dy, INK_FAINT, 1);
    line(ctx, x2 + dx - tick, y2 + dy, x2 + dx + tick, y2 + dy, INK_FAINT, 1);
  }
  const mx = (x1 + x2) / 2 + dx;
  const my = (y1 + y2) / 2 + dy;
  ctx.save();
  ctx.font = `10px ${FONT}`;
  const w = ctx.measureText(label).width + 10;
  ctx.fillStyle = PAPER;
  ctx.fillRect(mx - w / 2, my - 8, w, 14);
  ctx.restore();
  text(ctx, label, mx, my + 3, 10, INK, 'center');
}

export function titleBlock(ctx) {
  const r = { x: 22, y: 16, w: 724, h: 62 };
  ctx.fillStyle = 'rgba(244,239,227,0.93)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  outline(ctx, r, INK, 1.8);
  line(ctx, r.x, r.y + 27, r.x + r.w, r.y + 27, INK, 1);
  text(ctx, TITLE_BLOCK_LINES[0], r.x + 12, r.y + 19, 14, INK, 'left', 'bold');
  text(ctx, TITLE_BLOCK_LINES[1], r.x + 12, r.y + 48, 10, INK, 'left');
  text(ctx, 'A1', r.x + r.w - 22, r.y + 19, 11, INK, 'center');
}

export function stamp(ctx, label, x, y, color = PALETTE.red, angle = -0.17, size = 40) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `bold ${size}px ${FONT}`;
  const w = ctx.measureText(label).width + 34;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(-w / 2, -size * 0.75, w, size * 1.5);
  ctx.strokeRect(-w / 2 + 6, -size * 0.75 + 6, w - 12, size * 1.5 - 12);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 2);
  ctx.restore();
}

export function arrow(ctx, x, y, angle, size = 7, color = INK) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-size, -size * 0.6);
  ctx.lineTo(0, 0);
  ctx.lineTo(-size, size * 0.6);
  ctx.stroke();
  ctx.restore();
}

export function panel(ctx, r, fill = 'rgba(244,239,227,0.95)') {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
  outline(ctx, r, INK, 2);
  line(ctx, r.x + 6, r.y + 6, r.x + r.w - 6, r.y + 6, INK_FAINT, 1);
  line(ctx, r.x + 6, r.y + r.h - 6, r.x + r.w - 6, r.y + r.h - 6, INK_FAINT, 1);
}
