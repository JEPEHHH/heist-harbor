// Title, shop, pause, caught and results overlays. Panels are paper, ink and one accent.
import { CANVAS, FONT, INK, INK_FAINT, INK_GHOST, PALETTE, PAPER } from './config.js';
import * as art from './art.js';
import { ROOM_NAMES, TUNE } from './config.js';
import { beltSlots } from './inventory.js';
import { SCREEN } from './state.js';

const SHOP = { x: 250, y: 156, w: 790, h: 486 };
export function shopSlotRects() {
  return Array.from({ length: 5 }, (_, i) => ({ x: SHOP.x + 28, y: 246 + i * 66, w: SHOP.w - 56, h: 56 }));
}

function dim(ctx, alpha = 0.55) {
  ctx.fillStyle = `rgba(244,239,227,${alpha})`;
  ctx.fillRect(0, 0, CANVAS.w, CANVAS.h);
}

function titleScreen(ctx) {
  const band = { x: 0, y: 84, w: 1280, h: 64 };
  ctx.fillStyle = 'rgba(244,239,227,0.93)';
  ctx.fillRect(band.x, band.y, band.w, band.h);
  art.line(ctx, 0, 84, 1280, 84, INK, 1.6);
  art.line(ctx, 0, 148, 1280, 148, INK, 1.6);
  art.text(ctx, 'BLUEPRINT', 300, 132, 46, INK, 'left', 'bold');
  art.text(ctx, 'THE MARROW JOB', 582, 129, 26, INK, 'left');
  art.text(ctx, 'PRESS ENTER TO INFILTRATE', 1250, 126, 14, PALETTE.red, 'right', 'bold');
  const strip = { x: 0, y: 754, w: 1280, h: 46 };
  ctx.fillStyle = 'rgba(244,239,227,0.94)';
  ctx.fillRect(strip.x, strip.y, strip.w, strip.h);
  art.line(ctx, 0, 754, 1280, 754, INK, 1.4);
  art.text(ctx, 'WASD / ARROWS MOVE   SHIFT SPRINT   C CROUCH   E INTERACT   1-5 SELECT TOOL   CLICK USE   P PAUSE   R RESTART', 640, 778, 12, INK, 'center', 'bold');
  art.text(ctx, 'THREE ROOMS. THREE ROUTES. ONE LEDGER. ONE VAN.', 640, 794, 9, INK_FAINT, 'center');
}

function shopScreen(ctx, state) {
  dim(ctx, 0.72);
  art.panel(ctx, SHOP);
  art.text(ctx, `TOOL BELT — ROOM 0${state.roomIndex + 1}/3 · ${ROOM_NAMES[state.roomIndex]}`, SHOP.x + 28, 200, 19, INK, 'left', 'bold');
  art.text(ctx, `BUDGET ${state.belt.credits}c  ·  SPENT ${state.belt.spent}c TOTAL`, SHOP.x + SHOP.w - 28, 200, 13, INK, 'right');
  art.line(ctx, SHOP.x + 28, 214, SHOP.x + SHOP.w - 28, 214, INK_FAINT, 1);
  const slots = beltSlots(state.belt);
  const rects = shopSlotRects();
  slots.forEach((slot, i) => {
    const r = rects[i];
    ctx.fillStyle = slot.selected ? 'rgba(201,138,27,0.12)' : 'rgba(244,239,227,0.9)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    art.outline(ctx, r, slot.selected ? PALETTE.amber : INK_FAINT, slot.selected ? 2 : 1);
    art.text(ctx, slot.key, r.x + 16, r.y + 35, 17, INK, 'center', 'bold');
    art.text(ctx, slot.name, r.x + 44, r.y + 22, 13, INK, 'left', 'bold');
    art.text(ctx, slot.note, r.x + 44, r.y + 41, 10, INK_FAINT, 'left');
    const tag = slot.available ? (slot.kind === 'passive' ? 'OWNED' : `x${slot.count}`) : `${slot.cost}c`;
    art.text(ctx, slot.available ? tag : (slot.affordable ? `BUY ${tag}` : 'NO FUNDS'), r.x + r.w - 16, r.y + 35, 11, slot.affordable || slot.available ? PALETTE.amber : PALETTE.red, 'right', 'bold');
  });
  art.text(ctx, 'CLICK A ROW TO BUY · ENTER TO BEGIN THE ROOM', SHOP.x + SHOP.w / 2, SHOP.y + SHOP.h - 40, 13, INK, 'center', 'bold');
  art.text(ctx, 'VENT = SILENT AND SLOW · CARD = CLONER OR PRY · FLOOR = FAST AND PATROLLED', SHOP.x + SHOP.w / 2, SHOP.y + SHOP.h - 20, 10, INK_FAINT, 'center');
}

function pauseScreen(ctx) {
  dim(ctx, 0.55);
  art.stamp(ctx, 'PAUSED', 640, 360, INK, -0.1, 52);
  art.panel(ctx, { x: 480, y: 460, w: 320, h: 76 });
  art.text(ctx, 'P — RESUME    R — RESTART ROOM', 640, 500, 14, INK, 'center', 'bold');
}

function caughtScreen(ctx, state) {
  dim(ctx, 0.28);
  art.stamp(ctx, 'CAUGHT', 620, 370, PALETTE.red, -0.12, 76);
  art.panel(ctx, { x: 380, y: 452, w: 520, h: 112 });
  art.text(ctx, `DETECTED BY ${state.caughtBy || 'A GUARD CONE'}`, 640, 492, 17, PALETTE.red, 'center', 'bold');
  art.text(ctx, `ALARM ${Math.round(state.alarm.value)} / 100  ·  PLAN 0${state.roomIndex + 1}/3`, 640, 518, 12, INK, 'center');
  art.text(ctx, 'R — RESTART THIS ROOM', 640, 546, 14, INK, 'center', 'bold');
}

function resultsScreen(ctx, state) {
  dim(ctx, 0.74);
  const r = { x: 316, y: 162, w: 648, h: 480 };
  art.panel(ctx, r);
  art.text(ctx, 'JOB COMPLETE — THE MARROW LEDGER IS OUT', 640, 216, 21, INK, 'center', 'bold');
  art.line(ctx, r.x + 40, 232, r.x + r.w - 40, 232, INK_FAINT, 1);
  const s = state.results;
  const rows = [
    ['LEDGER + OPTIONAL LOOT', `+${s.loot}`],
    ['TIME BONUS', `+${s.timeBonus}`],
    ['NO-ALARM BONUS', `+${s.noAlarmBonus}`],
    ['TOOL SPEND', `-${s.spend}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 282 + i * 48;
    art.text(ctx, label, r.x + 52, y, 15, INK, 'left');
    art.text(ctx, value, r.x + r.w - 52, y, 16, i === 3 ? PALETTE.red : INK, 'right', 'bold');
    art.line(ctx, r.x + 52, y + 12, r.x + r.w - 52, y + 12, INK_GHOST, 1);
  });
  art.line(ctx, r.x + 52, 492, r.x + r.w - 52, 492, INK, 2);
  art.text(ctx, 'FINAL SCORE', r.x + 52, 532, 19, INK, 'left', 'bold');
  art.text(ctx, String(s.total), r.x + r.w - 52, 536, 34, PALETTE.amber, 'right', 'bold');
  art.text(ctx, `MAX ALARM ${Math.round(state.maxAlarm)} · TIME ${state.elapsed.toFixed(1)}s`, 640, 578, 11, INK_FAINT, 'center');
  art.text(ctx, 'PRESS ENTER FOR A NEW RUN', 640, 614, 14, INK, 'center', 'bold');
}

export function drawScreen(ctx, state) {
  switch (state.screen) {
    case SCREEN.title: titleScreen(ctx); break;
    case SCREEN.shop: shopScreen(ctx, state); break;
    case SCREEN.paused: pauseScreen(ctx); break;
    case SCREEN.caught: caughtScreen(ctx, state); break;
    case SCREEN.results: resultsScreen(ctx, state); break;
    default: break;
  }
}
