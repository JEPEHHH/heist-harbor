// Vision maths: hatched wedge point tests, line-of-sight blockers, smoke and crouch modifiers.
import { TUNE } from './config.js';
import { dist, inWedge, v, wedgePolygon } from './geometry.js';
import { solidRects } from './level.js';

function pointSegmentDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 < 1e-6) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function smokeBlocks(from, to, smokes) {
  for (const s of smokes) {
    if (s.life <= 0) continue;
    if (pointSegmentDistance(v(s.x, s.y), from, to) < s.r) return true;
  }
  return false;
}

export function blockersFor(room) {
  return solidRects(room);
}

export function guardDetection(guard, thief, room, smokes) {
  if (thief.inVent) return false;
  const from = v(guard.x, guard.y);
  const to = v(thief.x, thief.y);
  if (smokeBlocks(from, to, smokes)) return false;
  let range = TUNE.visionRange;
  if (thief.crouch) range *= 0.72;
  if (thief.sprint) range *= 1.08;
  return inWedge(from, guard.facing, TUNE.visionHalfAngle, range, to, blockersFor(room));
}

export function cameraDetection(camera, thief, room, smokes, time) {
  if (thief.inVent) return false;
  const from = v(camera.x, camera.y);
  const to = v(thief.x, thief.y);
  if (smokeBlocks(from, to, smokes)) return false;
  const angle = cameraAngleOf(camera, time);
  let range = TUNE.cameraRange;
  if (thief.crouch) range *= 0.78;
  return inWedge(from, angle, TUNE.cameraHalfAngle, range, to, blockersFor(room));
}

function cameraAngleOf(camera, time) {
  return camera.base + Math.sin(time * 1.05 + camera.phase) * TUNE.cameraSweep;
}

export function conePolygon(guard) {
  return wedgePolygon(v(guard.x, guard.y), guard.facing, TUNE.visionHalfAngle, TUNE.visionRange, 12);
}

export function arcPolygon(camera, time) {
  return wedgePolygon(v(camera.x, camera.y), cameraAngleOf(camera, time), TUNE.cameraHalfAngle, TUNE.cameraRange, 22);
}

export function guardedBy(guards, p, room, smokes) {
  return guards.some((g) => guardDetection(g, { ...p, inVent: false, crouch: false, sprint: false, busy: 0 }, room, smokes));
}
