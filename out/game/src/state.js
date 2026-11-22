// Game state, room transitions, interactions and scoring. No drawing, no browser APIs.

import { TUNE } from './config.js';
import { clamp, dist, resolveRect } from './geometry.js';
import { buildRoom, isInVent, solidRects } from './level.js';
import { createRandom } from './random.js';
import { createBelt, grantRoomBudget, hasTool } from './inventory.js';
import { createAlarm, updateAlarm } from './alarm.js';
import { createGuards, nearestGuard, updateGuards } from './patrol.js';
import { createCameras, updateCameras } from './camera.js';
import { cameraDetection, guardDetection } from './vision.js';
import { useTool } from './tools.js';

export const SCREEN = {
  title: 'title', shop: 'shop', play: 'play', paused: 'paused', caught: 'caught', results: 'results',
};

function makeThief(start) {
  return {
    x: start.x, y: start.y, r: TUNE.thiefRadius, facing: 0,
    crouch: false, sprint: false, inVent: false, noiseRadius: 0,
    hasLedger: false, busy: 0, busyKind: null, trail: [], trailTimer: 0, footstep: 0,
  };
}

export function createState(seed = TUNE.seed) {
  const state = {
    screen: SCREEN.title, seed, rng: createRandom(seed),
    roomIndex: 1, room: buildRoom(1), time: 1.1, elapsed: 0, roomTime: 0,
    belt: createBelt(), alarm: createAlarm(),
    thief: makeThief({ x: 420, y: 596 }),
    guards: [], cameras: [], smokes: [], decoyMark: null,
    totalLoot: 0, maxAlarm: 0, message: '', messageTimer: 0,
    caughtBy: null, results: null, pausedFrom: null,
  };
  stageCover(state);
  return state;
}

export function say(state, message, seconds = 2.6) {
  state.message = message;
  state.messageTimer = seconds;
}

export function enterRoom(state, index) {
  const carriedLedger = state.thief?.hasLedger ?? false;
  state.hadLedgerAtEntry = carriedLedger;
  state.roomIndex = clamp(index, 0, 2);
  state.room = buildRoom(state.roomIndex);
  state.thief = makeThief(state.room.start);
  state.thief.hasLedger = carriedLedger;
  state.guards = createGuards(state.room);
  state.cameras = createCameras(state.room);
  state.alarm = createAlarm();
  state.smokes = [];
  state.decoyMark = null;
  state.roomTime = 0;
  state.caughtBy = null;
  grantRoomBudget(state.belt);
  updateCameras(state.cameras, state.time);
  say(state, `ROOM ${state.roomIndex + 1}/3 — ${state.room.name}. ${state.room.brief}`, 4.5);
}

export function startRun(state) {
  state.belt = createBelt();
  state.elapsed = 0;
  state.totalLoot = 0;
  state.maxAlarm = 0;
  state.thief.hasLedger = false;
  state.results = null;
  enterRoom(state, 0);
  state.screen = SCREEN.shop;
}

export function restartRoom(state) {
  state.thief.hasLedger = state.hadLedgerAtEntry ?? false;
  enterRoom(state, state.roomIndex);
  state.screen = SCREEN.shop;
}

export function beginRoom(state) {
  state.screen = SCREEN.play;
  say(state, state.room.brief, 3.2);
}

export function computeScore(state) {
  const loot = state.totalLoot;
  const timeBonus = Math.max(0, Math.round(TUNE.totalTimeBonusCap - state.elapsed * 7));
  const noAlarmBonus = state.maxAlarm < TUNE.alertThreshold ? 500 : Math.max(0, Math.round(500 - (state.maxAlarm - TUNE.alertThreshold) * 8));
  const spend = state.belt.spent;
  return { loot, timeBonus, noAlarmBonus, spend, total: Math.max(0, loot + timeBonus + noAlarmBonus - spend) };
}

export function finishRun(state) {
  state.results = computeScore(state);
  state.screen = SCREEN.results;
  return { type: 'success' };
}

function moveThief(state, dt, control) {
  const t = state.thief;
  t.crouch = Boolean(control.crouch);
  t.sprint = Boolean(control.sprint) && !t.crouch;
  t.inVent = isInVent(state.room, t);
  let speed = t.crouch ? TUNE.crouchSpeed : t.sprint ? TUNE.sprintSpeed : TUNE.walkSpeed;
  if (t.inVent) speed = TUNE.ventSpeed;
  if (t.busy > 0) speed = 0;
  const dx = control.dx || 0;
  const dy = control.dy || 0;
  const mag = Math.hypot(dx, dy);
  if (mag > 0.01) {
    const nx = dx / mag;
    const ny = dy / mag;
    t.facing = Math.atan2(ny, nx);
    const blockers = solidRects(state.room);
    let px = clamp(t.x + nx * speed * dt, state.room.walls[3].x + t.r, 1126);
    let py = clamp(t.y + ny * speed * dt, 166, 694);
    for (const r of blockers) {
      const p = resolveRect(px, py, t.r, r);
      px = p.x; py = p.y;
    }
    t.x = px; t.y = py;
    t.footstep -= dt;
    if (t.footstep <= 0) {
      t.footstep = t.crouch ? 0.5 : t.sprint ? 0.22 : 0.34;
      return { type: 'step', soft: t.crouch };
    }
  }
  t.noiseRadius = t.inVent || t.busy > 0 ? 0 : (t.crouch ? 42 : t.sprint ? 190 : 108) * (hasTool(state.belt, 'shoes') ? 0.5 : 1);
  t.trailTimer -= dt;
  if (t.trailTimer <= 0 && mag > 0.01) {
    t.trailTimer = 0.11;
    t.trail.push({ x: t.x, y: t.y });
    if (t.trail.length > 16) t.trail.shift();
  }
  return null;
}

function finishBusy(state) {
  const kind = state.thief.busyKind;
  state.thief.busyKind = null;
  if (kind === 'card') {
    const door = state.room.doors.find((d) => d.id === 'card');
    if (door) { door.locked = false; door.opened = true; }
    say(state, 'CARD-01 FORCED — ALARM TRIPPED');
  } else if (kind === 'cage') {
    const door = state.room.doors.find((d) => d.id === 'cage');
    if (door) { door.locked = false; door.opened = true; }
    say(state, 'CAGE PRIED OPEN — ALARM TRIPPED');
  }
}

function interact(state) {
  const t = state.thief;
  if (t.busy > 0) return null;
  const p = { x: t.x, y: t.y };
  const door = state.room.doors.find((d) => d.locked && dist(p, { x: d.x + 4, y: d.y + d.h / 2 }) < TUNE.interactRange);
  if (door) {
    const passive = door.kind === 'card' ? 'cloner' : 'cutters';
    if (hasTool(state.belt, passive)) {
      door.locked = false;
      door.opened = true;
      say(state, `${door.label} OPENED WITH ${passive.toUpperCase()}`);
      return { type: 'door' };
    }
    t.busy = door.kind === 'card' ? 2.6 : 3;
    t.busyKind = door.kind;
    say(state, `FORCING ${door.label} — NEED ${passive.toUpperCase()} FOR A SILENT OPEN`);
    return null;
  }
  const ledger = state.room.ledger;
  if (ledger && !ledger.taken && dist(p, ledger) < TUNE.interactRange) {
    if (!hasTool(state.belt, 'cutters') && state.room.doors.find((d) => d.id === 'cage')?.locked) {
      say(state, 'CAGE LOCKED — E AT THE CAGE DOOR');
      return null;
    }
    ledger.taken = true;
    t.hasLedger = true;
    say(state, 'MARROW LEDGER SECURED — GET TO THE VAN', 4);
    return { type: 'ledger' };
  }
  for (const item of state.room.loot) {
    if (!item.taken && dist(p, { x: item.x + item.w / 2, y: item.y + item.h / 2 }) < TUNE.interactRange) {
      item.taken = true;
      state.totalLoot += item.value;
      state.alarm.value = Math.min(99, state.alarm.value + 6);
      say(state, `${item.label} +${item.value} — NOISE RAISES ALARM`);
      return { type: 'loot' };
    }
  }
  const exit = state.room.exit;
  if (dist(p, { x: exit.x + exit.w / 2, y: exit.y + exit.h / 2 }) < 82) {
    if (state.roomIndex === 1 && !t.hasLedger) {
      say(state, 'THE MARROW LEDGER IS STILL IN THE CAGE');
      return null;
    }
    if (state.roomIndex === 2) return finishRun(state);
    enterRoom(state, state.roomIndex + 1);
    state.screen = SCREEN.shop;
    return { type: 'advance' };
  }
  say(state, 'NOTHING TO INTERACT WITH HERE');
  return null;
}

/** One fixed simulation step. Returns events for audio and the loop. */
export function stepPlay(state, dt, control) {
  const events = [];
  if (state.screen !== SCREEN.play) return events;
  state.time += dt;
  state.elapsed += dt;
  state.roomTime += dt;
  state.messageTimer = Math.max(0, state.messageTimer - dt);
  if (state.thief.busy > 0) {
    state.thief.busy = Math.max(0, state.thief.busy - dt);
    if (state.thief.busy === 0 && state.thief.busyKind) events.push(finishBusy(state) ?? { type: 'door' });
  }
  const stepEvent = moveThief(state, dt, control);
  if (stepEvent) events.push(stepEvent);
  if (control.click) events.push({ type: 'tool', message: useTool(state, control.click) });
  for (const s of state.smokes) s.life -= dt;
  state.smokes = state.smokes.filter((s) => s.life > 0);
  if (state.decoyMark) {
    state.decoyMark.life -= dt;
    if (state.decoyMark.life <= 0) state.decoyMark = null;
  }
  updateCameras(state.cameras, state.time);
  updateGuards(state.guards, dt, state);
  const sightings = [];
  for (const g of state.guards) {
    g.seen = guardDetection(g, state.thief, state.room, state.smokes);
    if (g.seen) sightings.push({ source: `${g.id} CONE`, rate: TUNE.alarmRiseGuard });
  }
  for (const cam of state.cameras) {
    cam.seen = cameraDetection(cam, state.thief, state.room, state.smokes, state.time);
    if (cam.seen) sightings.push({ source: `${cam.id} ARC`, rate: TUNE.alarmRiseCamera });
  }
  const result = updateAlarm(state.alarm, dt, sightings);
  state.maxAlarm = Math.max(state.maxAlarm, state.alarm.max);
  if (result.alertedNow) {
    events.push({ type: 'alert' });
    say(state, 'PATROL ALERTED — GUARDS MOVING FAST', 3.4);
  }
  if (result.caught) {
    state.caughtBy = result.culprit;
    state.screen = SCREEN.caught;
    events.push({ type: 'caught' });
    return events;
  }
  if (control.interact) {
    const event = interact(state);
    if (event) events.push(event);
  }
  return events;
}

// Staged frames for the title and the three screenshot queries. All use real drawing code.
const COVER_GUARDS = [
  { x: 606, y: 520, facing: 2.42 },
  { x: 848, y: 612, facing: 2.75 },
  { x: 1014, y: 520, facing: 2.55 },
];

function stageScene(state, screen, alarmValue) {
  enterRoom(state, 1);
  state.thief.x = 424;
  state.thief.y = 596;
  state.thief.crouch = true;
  state.thief.sprint = false;
  state.thief.facing = 0.12;
  state.thief.trail = [];
  for (let i = 7; i >= 0; i--) state.thief.trail.push({ x: 424 - i * 19, y: 596 + Math.sin(i * 0.8) * 5 });
  state.guards.forEach((g, i) => {
    g.x = COVER_GUARDS[i].x;
    g.y = COVER_GUARDS[i].y;
    g.facing = COVER_GUARDS[i].facing;
    g.state = 'PATROL';
  });
  state.time = 1.1;
  updateCameras(state.cameras, state.time);
  state.alarm.value = alarmValue;
  state.alarm.max = alarmValue;
  state.alarm.alerted = alarmValue >= TUNE.alertThreshold;
  state.screen = screen;
}

export function stageCover(state) {
  stageScene(state, SCREEN.title, 18);
}

export function stagePlayShot(state) {
  stageScene(state, SCREEN.play, 36);
  state.message = 'STAY OUT OF THE HATCHED CONES — E TO TAKE THE LEDGER';
  state.messageTimer = 5;
}

export function stageEndShot(state) {
  stageScene(state, SCREEN.results, 22);
  state.totalLoot = 480;
  state.elapsed = 62;
  state.belt.spent = 80;
  state.maxAlarm = state.alarm.max;
  state.results = computeScore(state);
}
