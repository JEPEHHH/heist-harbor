// Draws the blueprint plan, ink silhouettes, hatched cones and camera arcs.
import { CANVAS, INK, INK_FAINT, INK_GHOST, PALETTE, FONT } from './config.js';
import * as art from './art.js';
import { arcPolygon, conePolygon } from './vision.js';
import { drawHud } from './hud.js';
import { drawScreen } from './screens.js';

const RED_WASH = 'rgba(200,64,44,0.055)';
const RED_HATCH = 'rgba(200,64,44,0.20)';
const RED_EDGE = 'rgba(200,64,44,0.42)';
const AMBER_FAINT = 'rgba(201,138,27,0.18)';

function fillPolygon(ctx, points, fill) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function dashedPath(ctx, points, color, width = 1.4, dash = [5, 5]) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();
}

function drawShell(ctx, room) {
  for (const w of room.walls) {
    art.hatchRect(ctx, w, INK_GHOST, 8);
    art.outline(ctx, w, INK, 1.8);
  }
  for (const c of room.cover) {
    art.hatchRect(ctx, c, INK_FAINT, 6);
    art.outline(ctx, c, INK, 1.6);
    art.text(ctx, c.label.toUpperCase(), c.x, c.y - 5, 9, INK, 'left');
  }
  art.dimension(ctx, 270, 712, 948, 712, 'FLOOR RUN 12.8m', 0);
  art.dimension(ctx, 1148, 284, 1148, 448, '3.4m', 0);
  art.text(ctx, `PLAN 0${room.index + 1} — ${room.name}`, 78, 736, 17, INK, 'left', 'bold');
  art.text(ctx, room.brief, 78, 755, 11, INK, 'left');
}

function drawRoutes(ctx, room) {
  for (const route of room.routes) {
    dashedPath(ctx, route.points, INK_GHOST, 1, [2, 7]);
  }
  art.text(ctx, 'VENT / SILENT', 282, 268, 9, INK_FAINT);
  art.text(ctx, 'CARD ACCESS', 282, 430, 9, INK_FAINT);
  art.text(ctx, 'MAIN FLOOR / PATROLLED', 282, 468, 9, INK_FAINT);
}

function drawVent(ctx, room) {
  const v = room.vent;
  ctx.save();
  ctx.setLineDash([9, 6]);
  art.outline(ctx, v, INK_FAINT, 1.4, [9, 6]);
  ctx.restore();
  for (let x = v.x + 34; x < v.x + v.w; x += 44) {
    art.line(ctx, x, v.y + 6, x, v.y + v.h - 6, INK_GHOST, 1, [3, 4]);
  }
  art.text(ctx, 'ROUTE A — VENT CRAWL · NO CAMERA COVERAGE · SLOW', v.x + 8, v.y - 7, 10, INK, 'left');
  art.arrow(ctx, v.x + v.w - 24, v.y + v.h / 2, 0, 8, INK_FAINT);
}

function drawDoors(ctx, room) {
  for (const d of room.doors) {
    if (!d.locked && !d.opened) continue;
    if (!d.locked) {
      art.line(ctx, d.x - 12, d.y - 6, d.x - 2, d.y + d.h + 6, INK_FAINT, 1.2, [4, 3]);
      art.text(ctx, `${d.label} OPEN`, d.x - 14, d.y - 10, 9, INK_FAINT);
      continue;
    }
    art.hatchRect(ctx, { x: d.x - 2, y: d.y, w: d.w + 4, h: d.h }, INK_FAINT, 4);
    art.outline(ctx, { x: d.x - 2, y: d.y, w: d.w + 4, h: d.h }, INK, 2);
    art.circle(ctx, d.x + 4, d.y + d.h / 2, 4, INK, 1.2, PALETTE.paper);
    art.text(ctx, d.label, d.x - 48, d.y - 7, 10, INK, 'left', 'bold');
    art.text(ctx, d.kind === 'card' ? 'KEYCARD' : 'BOLTED', d.x - 48, d.y + d.h + 13, 9, INK_FAINT);
  }
}

function drawVault(ctx, room) {
  const c = room.cage;
  const cageDoor = room.doors.find((d) => d.id === 'cage');
  art.outline(ctx, c, INK, 2.4);
  art.hatchRect(ctx, { x: c.x + 2, y: c.y + 2, w: c.w - 4, h: c.h - 4 }, 'rgba(28,42,58,0.045)', 10);
  for (let i = 0; i < 7; i++) {
    const bar = { x: c.x + 12 + i * 12, y: c.y + 3, w: 3.5, h: c.h - 6 };
    art.hatchRect(ctx, bar, INK_FAINT, 4);
    art.outline(ctx, bar, INK, 1.2);
  }
  art.line(ctx, c.x + 3, c.y + c.h / 2, c.x + c.w - 3, c.y + c.h / 2, INK_FAINT, 1);
  if (cageDoor) {
    for (const hy of [cageDoor.y + 6, cageDoor.y + cageDoor.h - 6]) {
      art.line(ctx, cageDoor.x - 2, hy, cageDoor.x + 15, hy, INK, 2.2);
      art.circle(ctx, cageDoor.x + 15, hy, 2.6, INK, 1, PALETTE.paper);
    }
    const lx = cageDoor.x + 22;
    const ly = cageDoor.y + cageDoor.h / 2;
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lx, ly - 9, 4, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(lx - 6, ly - 9, 12, 11);
    ctx.strokeRect(lx - 6, ly - 9, 12, 11);
    ctx.restore();
    art.circle(ctx, lx, ly - 3, 1.2, INK, 0, INK);
  }
  art.dimension(ctx, c.x, c.y - 12, c.x + c.w, c.y - 12, 'VAULT 3.4m', 0);
  art.text(ctx, 'MARROW LEDGER', c.x + c.w / 2, c.y - 30, 10, INK, 'center', 'bold');
  const ledger = room.ledger;
  const cx = ledger ? ledger.x : c.x + c.w / 2;
  const cy = ledger ? ledger.y : c.y + c.h / 2;
  const lower = { x: cx - 30, y: cy + 20, w: 60, h: 9 };
  const upper = { x: cx - 24, y: cy + 14, w: 48, h: 6 };
  art.hatchRect(ctx, lower, INK_FAINT, 5);
  art.outline(ctx, lower, INK, 1.4);
  art.hatchRect(ctx, upper, INK_FAINT, 5);
  art.outline(ctx, upper, INK, 1.4);
  if (ledger && !ledger.taken) {
    for (let i = 3; i >= 1; i--) {
      ctx.save();
      ctx.strokeStyle = `rgba(201,138,27,${0.07 + i * 0.035})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, 17 + i * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = 'rgba(201,138,27,0.16)';
    ctx.fillRect(cx - 11, cy - 12, 26, 20);
    ctx.fillStyle = PALETTE.paper;
    ctx.strokeStyle = PALETTE.amber;
    ctx.lineWidth = 2.2;
    ctx.fillRect(cx - 14, cy - 10, 28, 20);
    ctx.strokeRect(cx - 14, cy - 10, 28, 20);
    ctx.restore();
    art.line(ctx, cx - 9, cy - 10, cx - 9, cy + 10, PALETTE.amber, 1.3);
    for (let i = -5; i <= 5; i += 5) art.line(ctx, cx - 5, cy + i, cx + 10, cy + i, AMBER_FAINT, 1);
    art.text(ctx, 'LEDGER', cx, cy + 3, 8, INK, 'center');
  } else {
    art.text(ctx, ledger ? 'REMOVED' : 'EMPTY', cx, cy + 4, 9, INK_FAINT, 'center');
  }
}

function drawExitVan(ctx, room) {
  const e = room.exit;
  ctx.save();
  ctx.setLineDash([6, 5]);
  art.outline(ctx, e, INK_FAINT, 1.4, [6, 5]);
  ctx.restore();
  art.text(ctx, 'EXIT', e.x + 8, e.y - 10, 12, INK, 'left', 'bold');
  const x = 1080;
  const y = 620;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(244,239,227,0.65)';
  ctx.beginPath();
  ctx.moveTo(x, y + 12);
  ctx.lineTo(x + 8, y);
  ctx.lineTo(x + 36, y);
  ctx.lineTo(x + 48, y + 12);
  ctx.lineTo(x + 48, y + 56);
  ctx.lineTo(x, y + 56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  art.hatchRect(ctx, { x: x + 10, y: y + 7, w: 22, h: 13 }, INK_FAINT, 4);
  art.outline(ctx, { x: x + 10, y: y + 7, w: 22, h: 13 }, INK, 1.4);
  art.circle(ctx, x + 10, y + 57, 6, INK, 1.6, PALETTE.paper);
  art.circle(ctx, x + 38, y + 57, 6, INK, 1.6, PALETTE.paper);
  art.text(ctx, 'GETAWAY VAN', x + 24, y - 8, 9, INK, 'center');
  art.arrow(ctx, x - 18, y + 28, 0, 8, INK_FAINT);
}

function drawCameras(ctx, state) {
  for (const cam of state.cameras) {
    const poly = arcPolygon(cam, state.time);
    fillPolygon(ctx, poly, RED_WASH);
    art.hatchPolygon(ctx, poly, RED_HATCH, 13);
    const a1 = cam.angle - cam.halfAngle;
    const a2 = cam.angle + cam.halfAngle;
    ctx.save();
    ctx.strokeStyle = RED_EDGE;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, cam.range, a1, a2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(a1) * cam.range, cam.y + Math.sin(a1) * cam.range);
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(a2) * cam.range, cam.y + Math.sin(a2) * cam.range);
    ctx.stroke();
    ctx.restore();
    art.line(ctx, cam.x, 150, cam.x, cam.y - 8, INK, 2);
    art.circle(ctx, cam.x, cam.y, 10, INK, 1.8, PALETTE.paper);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    art.outline(ctx, { x: 0, y: -5, w: 15, h: 10 }, INK, 1.5);
    ctx.restore();
    art.circle(ctx, cam.x, cam.y, 2.4, PALETTE.red, 0, PALETTE.red);
    art.text(ctx, cam.label, cam.x + 14, cam.y + 22, 10, INK, 'left', 'bold');
  }
}

function drawGuard(ctx, g, state) {
  const poly = conePolygon(g);
  fillPolygon(ctx, poly, state.alarm.alerted ? 'rgba(200,64,44,0.10)' : RED_WASH);
  art.hatchPolygon(ctx, poly, g.seen ? 'rgba(200,64,44,0.36)' : RED_HATCH, 11);
  ctx.save();
  ctx.strokeStyle = g.seen ? PALETTE.red : RED_EDGE;
  ctx.lineWidth = g.seen ? 2 : 1.3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(g.x, g.y, 242, g.facing - 0.42, g.facing + 0.42);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.facing);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(-2, -2, 7, 4);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -8); ctx.lineTo(-3, -3);
  ctx.moveTo(-8, 8); ctx.lineTo(-3, 3);
  ctx.moveTo(11, 0); ctx.lineTo(17, 0);
  ctx.stroke();
  ctx.restore();
  if (g.seen) art.circle(ctx, g.x, g.y, 19, PALETTE.red, 1.5, null, [3, 4]);
  art.text(ctx, g.id, g.x + 12, g.y - 15, 10, INK, 'left', 'bold');
}

function drawThief(ctx, state) {
  const t = state.thief;
  dashedPath(ctx, t.trail, INK_FAINT, 1.6, [4, 4]);
  for (const p of t.trail) art.circle(ctx, p.x, p.y, 1.6, INK_FAINT, 0, INK_FAINT);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.facing);
  ctx.scale(t.crouch ? 0.86 : 1, t.crouch ? 0.82 : 1);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(11, 0, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, 4); ctx.lineTo(-11, 10); ctx.lineTo(-17, 6);
  ctx.moveTo(0, -4); ctx.lineTo(-9, -10); ctx.lineTo(-15, -7);
  ctx.moveTo(7, -3); ctx.lineTo(14, -8);
  ctx.stroke();
  if (t.hasLedger) {
    ctx.fillStyle = PALETTE.amber;
    ctx.fillRect(-9, -9, 9, 6);
  }
  ctx.restore();
  art.text(ctx, t.inVent ? 'THIEF / VENT' : t.crouch ? 'THIEF / CROUCH' : t.sprint ? 'THIEF / SPRINT' : 'THIEF', t.x, t.y - 22, 10, INK, 'center', 'bold');
  if (t.noiseRadius > 0 && !t.crouch) {
    art.circle(ctx, t.x, t.y, t.noiseRadius * 0.35, INK_GHOST, 1, null, [2, 6]);
  }
}

function drawEffects(ctx, state) {
  for (const s of state.smokes) {
    for (let i = 3; i >= 1; i--) {
      ctx.save();
      ctx.strokeStyle = `rgba(28,42,58,${0.05 + i * 0.05})`;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(s.x, s.y, (s.r * i) / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    art.text(ctx, 'SMOKE', s.x, s.y - s.r - 6, 10, INK, 'center', 'bold');
  }
  if (state.decoyMark) {
    const d = state.decoyMark;
    for (let i = 1; i <= 3; i++) art.circle(ctx, d.x, d.y, i * 10, PALETTE.red, 1, null, [3, 4]);
    art.text(ctx, 'DECOY', d.x, d.y - 38, 10, PALETTE.red, 'center', 'bold');
  }
  for (const item of state.room.loot) {
    if (item.taken) continue;
    art.hatchRect(ctx, item, AMBER_FAINT, 4);
    art.outline(ctx, item, PALETTE.amber, 1.6);
    art.text(ctx, item.label, item.x + item.w / 2, item.y - 5, 8, PALETTE.amber, 'center');
  }
}

export function drawPlan(ctx, state) {
  art.titleBlock(ctx);
  drawShell(ctx, state.room);
  drawRoutes(ctx, state.room);
  drawVent(ctx, state.room);
  drawDoors(ctx, state.room);
  drawVault(ctx, state.room);
  drawExitVan(ctx, state.room);
  drawEffects(ctx, state);
  drawCameras(ctx, state);
  for (const g of state.guards) drawGuard(ctx, g, state);
  drawThief(ctx, state);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, ox: 0, oy: 0 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    view.scale = Math.min(canvas.width / CANVAS.w, canvas.height / CANVAS.h);
    view.ox = (canvas.width - CANVAS.w * view.scale) / 2;
    view.oy = (canvas.height - CANVAS.h * view.scale) / 2;
  }

  function draw(state) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#dcd6c8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
    art.paper(ctx);
    drawPlan(ctx, state);
    drawHud(ctx, state);
    drawScreen(ctx, state);
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, view, resize };
}
