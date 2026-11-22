// Heads-up drawing: the alarm mercury column, room readout, tool belt and banners.
import { INK, INK_FAINT, INK_GHOST, PALETTE, PAPER, FONT, TUNE } from './config.js';
import * as art from './art.js';
import { alarmLabel } from './alarm.js';
import { beltSlots } from './inventory.js';

const GAUGE = { x: 1170, y: 158, w: 78, h: 540 };
const TUBE = { x: 1193, y: 194, w: 20, h: 438 };

let bannerState = null;
let bannerAlerted = false;
let bannerAt = 0;

function gauge(ctx, state) {
  const a = state.alarm;
  art.panel(ctx, GAUGE, 'rgba(244,239,227,0.92)');
  art.text(ctx, 'MERCURY', GAUGE.x + GAUGE.w / 2, 180, 9, INK, 'center');
  art.outline(ctx, TUBE, INK, 2);
  ctx.fillStyle = 'rgba(28,42,58,0.05)';
  ctx.fillRect(TUBE.x, TUBE.y, TUBE.w, TUBE.h);
  const fill = (Math.max(0, Math.min(100, a.value)) / 100) * TUBE.h;
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(TUBE.x, TUBE.y + TUBE.h - fill, TUBE.w, fill);
  for (let i = 0; i <= 100; i += 10) {
    const y = TUBE.y + TUBE.h - (i / 100) * TUBE.h;
    const major = i % 20 === 0;
    art.line(ctx, TUBE.x - (major ? 12 : 7), y, TUBE.x - 2, y, INK, major ? 1.4 : 1);
    art.text(ctx, String(i), TUBE.x + TUBE.w + 6, y + 3, major ? 9 : 8, major ? INK : INK_FAINT);
  }
  const thresholdY = TUBE.y + TUBE.h - (TUNE.alertThreshold / 100) * TUBE.h;
  art.line(ctx, TUBE.x - 3, thresholdY, TUBE.x + TUBE.w + 3, thresholdY, PALETTE.red, 1.4, [3, 3]);
  ctx.save();
  ctx.translate(1210, 450);
  ctx.rotate(-Math.PI / 2);
  art.text(ctx, 'ALARM', 0, 0, 15, INK, 'center', 'bold');
  ctx.restore();
  art.text(ctx, alarmLabel(a), GAUGE.x + GAUGE.w / 2, 668, 22, a.value >= 40 ? PALETTE.red : INK, 'center', 'bold');
  art.text(ctx, a.alerted ? 'THRESHOLD PASSED' : 'NOMINAL', GAUGE.x + GAUGE.w / 2, 684, 9, a.alerted ? PALETTE.red : INK_FAINT, 'center');
  art.line(ctx, GAUGE.x + 6, 692, GAUGE.x + GAUGE.w - 6, 692, INK_FAINT, 1);
  art.text(ctx, '0–100', GAUGE.x + GAUGE.w / 2, 706, 9, INK_FAINT, 'center');
}

function belt(ctx, state) {
  const slots = beltSlots(state.belt);
  const y = 758;
  slots.forEach((slot, i) => {
    const x = 302 + i * 158;
    const rect = { x, y, w: 150, h: 34 };
    ctx.fillStyle = slot.selected ? 'rgba(201,138,27,0.13)' : 'rgba(244,239,227,0.85)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    art.outline(ctx, rect, slot.selected ? PALETTE.amber : INK_FAINT, slot.selected ? 2 : 1);
    art.text(ctx, slot.key, x + 8, y + 23, 13, slot.available ? INK : INK_FAINT, 'left', 'bold');
    art.text(ctx, slot.name, x + 28, y + 15, 10, slot.available ? INK : INK_FAINT, 'left', 'bold');
    const suffix = slot.kind === 'passive' ? (slot.available ? 'OWNED' : `${slot.cost}c`) : (slot.available ? `x${slot.count}` : `${slot.cost}c`);
    art.text(ctx, suffix, x + 28, y + 28, 9, slot.affordable || slot.available ? INK_FAINT : PALETTE.red, 'left');
  });
}

function budgetChip(ctx, state) {
  const r = { x: 58, y: 758, w: 236, h: 34 };
  ctx.fillStyle = PAPER;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  art.outline(ctx, r, INK, 2);
  art.line(ctx, r.x + 130, r.y + 6, r.x + 130, r.y + r.h - 6, INK_FAINT, 1);
  art.text(ctx, `BUDGET ${TUNE.baseBudget}`, r.x + 8, r.y + 24, 20, INK, 'left', 'bold');
  art.text(ctx, `LEFT ${state.belt.credits}`, r.x + r.w - 8, r.y + 24, 20, INK, 'right', 'bold');
}

function patrolBanner(ctx, state) {
  if (bannerState !== state) {
    bannerState = state;
    bannerAlerted = state.alarm.alerted;
    bannerAt = state.time - 0.12;
  }
  if (state.alarm.alerted && !bannerAlerted) {
    bannerAlerted = true;
    bannerAt = state.time;
  } else if (!state.alarm.alerted) {
    bannerAlerted = false;
  }
  if (!state.alarm.alerted || state.screen !== 'play') return;

  const p = Math.max(0, Math.min(1, (state.time - bannerAt) / 0.12));
  const ease = 1 - (1 - p) ** 3;
  const w = 320;
  const h = 36;
  ctx.save();
  ctx.translate(210, 116 - 6 * (1 - ease));
  ctx.rotate(-Math.PI / 60);
  ctx.scale(1.06 - 0.06 * ease, 1.06 - 0.06 * ease);
  ctx.globalAlpha = 0.9 * Math.min(1, p * 2);
  ctx.fillStyle = 'rgba(244,239,227,0.72)';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = PALETTE.red;
  ctx.lineWidth = 4;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.lineWidth = 1;
  ctx.strokeRect(-w / 2 + 6, -h / 2 + 5, w - 12, h - 10);
  ctx.fillStyle = PALETTE.red;
  ctx.font = `bold 28px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PATROL ALERTED', 0, 1);
  ctx.restore();
}

export function drawHud(ctx, state) {
  const playing = state.screen === 'play' || state.screen === 'paused' || state.screen === 'caught';
  gauge(ctx, state);
  if (state.screen !== 'title') {
    art.text(ctx, `PLAN 0${state.roomIndex + 1}/3 · ${state.room.name}`, 610, 122, 15, INK, 'center', 'bold');
    art.text(ctx, `T+${state.elapsed.toFixed(1)}s`, 950, 122, 11, INK, 'left');
    art.text(ctx, `LOOT ${state.totalLoot}`, 1088, 122, 13, PALETTE.amber, 'right', 'bold');
  }
  if (state.screen === 'title' || state.screen === 'shop' || state.screen === 'results') return;
  if (playing) {
    budgetChip(ctx, state);
    belt(ctx, state);
  }
  if (state.messageTimer > 0 && state.message) {
    const w = Math.min(720, state.message.length * 7 + 36);
    art.panel(ctx, { x: 640 - w / 2, y: 92, w, h: 32 }, 'rgba(244,239,227,0.94)');
    art.text(ctx, state.message, 640, 114, 11, INK, 'center', 'bold');
  }
  patrolBanner(ctx, state);
  if (state.thief.busy > 0 && state.thief.busyKind) {
    const label = `FORCING ${state.thief.busyKind.toUpperCase()} ${state.thief.busy.toFixed(1)}s`;
    art.text(ctx, label, state.thief.x, state.thief.y + 34, 10, PALETTE.red, 'center', 'bold');
  }
  if (state.screen === 'play') {
    art.text(ctx, 'E INTERACT · 1-5 SELECT · CLICK USE · P PAUSE · R RESTART', 302, 790, 9, INK_GHOST);
  }
}
