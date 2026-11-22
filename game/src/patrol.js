// Guard patrol loops, alert states, decoy investigation and footstep-noise facing.
import { TUNE } from './config.js';
import { angleLerp, dist } from './geometry.js';

export function createGuards(room) {
  return room.guards.map((waypoints, i) => {
    const first = waypoints[0];
    const second = waypoints[1] ?? first;
    return {
      id: `G${i + 1}`,
      x: first.x,
      y: first.y,
      waypoints,
      idx: 1 % waypoints.length,
      facing: Math.atan2(second.y - first.y, second.x - first.x),
      speed: TUNE.guardWalk,
      state: 'PATROL',
      decoy: null,
      seen: false,
    };
  });
}

export function updateGuards(guards, dt, state) {
  const alerted = state.alarm.alerted;
  for (const g of guards) {
    let target = g.waypoints[g.idx];
    let speed = alerted ? TUNE.guardAlert : TUNE.guardWalk;
    if (g.decoy) {
      g.decoy.life -= dt;
      if (g.decoy.life <= 0) g.decoy = null;
      else {
        target = g.decoy;
        speed = TUNE.guardAlert * 0.82;
        g.state = 'INVESTIGATING';
      }
    }
    if (!g.decoy && state.thief.noiseRadius > 0 && !state.thief.inVent) {
      const d = dist(g, state.thief);
      if (d < state.thief.noiseRadius) {
        const toward = Math.atan2(state.thief.y - g.y, state.thief.x - g.x);
        g.facing = angleLerp(g.facing, toward, Math.min(1, dt * 4.5));
        g.state = 'LISTENING';
      } else if (g.state === 'LISTENING') g.state = 'PATROL';
    }
    const d = dist(g, target);
    if (!g.decoy && d < 7) {
      g.idx = (g.idx + 1) % g.waypoints.length;
      target = g.waypoints[g.idx];
    } else if (d > 1) {
      const dx = (target.x - g.x) / d;
      const dy = (target.y - g.y) / d;
      g.x += dx * speed * dt;
      g.y += dy * speed * dt;
      if (!g.decoy) {
        const want = Math.atan2(dy, dx);
        g.facing = angleLerp(g.facing, want, Math.min(1, dt * TUNE.guardTurnSpeed));
      }
      if (g.state !== 'LISTENING') g.state = alerted ? 'ALERTED' : 'PATROL';
    }
    if (g.decoy && d < 12) g.state = 'SEARCHING';
  }
}

export function nearestGuard(guards, point) {
  let best = null;
  let bestD = Infinity;
  for (const g of guards) {
    const d = dist(g, point);
    if (d < bestD) { bestD = d; best = g; }
  }
  return best;
}
