// Vectors, clipping, line-of-sight and polygon helpers. Pure maths, no drawing.

export const v = (x, y) => ({ x, y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a, s) => ({ x: a.x * s, y: a.y * s });
export const len = (a) => Math.hypot(a.x, a.y);
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function norm(a) {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l };
}
export const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
export const lerp = (a, b, t) => a + (b - a) * t;

export function angleLerp(a, b, t) {
  let d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + d * clamp(t, 0, 1);
}

export function angleDiff(a, b) {
  return Math.abs(((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
}

export function pointInRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function circleRect(cx, cy, radius, r) {
  const nx = clamp(cx, r.x, r.x + r.w);
  const ny = clamp(cy, r.y, r.y + r.h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 < radius * radius;
}

export function resolveRect(cx, cy, radius, r) {
  const nx = clamp(cx, r.x, r.x + r.w);
  const ny = clamp(cy, r.y, r.y + r.h);
  let dx = cx - nx;
  let dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= radius * radius) return { x: cx, y: cy };
  if (d2 > 0.0001) {
    const d = Math.sqrt(d2);
    return { x: nx + (dx / d) * radius, y: ny + (dy / d) * radius };
  }
  const left = Math.abs(cx - r.x);
  const right = Math.abs(r.x + r.w - cx);
  const top = Math.abs(cy - r.y);
  const bottom = Math.abs(r.y + r.h - cy);
  const m = Math.min(left, right, top, bottom);
  if (m === left) return { x: r.x - radius, y: cy };
  if (m === right) return { x: r.x + r.w + radius, y: cy };
  if (m === top) return { x: cx, y: r.y - radius };
  return { x: cx, y: r.y + r.h + radius };
}

export function segmentsCross(a, b, c, d) {
  const r = sub(b, a);
  const s = sub(d, c);
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return false;
  const q = sub(c, a);
  const t = (q.x * s.y - q.y * s.x) / den;
  const u = (q.x * r.y - q.y * r.x) / den;
  return t > 0 && t < 1 && u > 0 && u < 1;
}

export function segmentRectHit(a, b, r) {
  const p1 = v(r.x, r.y);
  const p2 = v(r.x + r.w, r.y);
  const p3 = v(r.x + r.w, r.y + r.h);
  const p4 = v(r.x, r.y + r.h);
  return (
    segmentsCross(a, b, p1, p2) ||
    segmentsCross(a, b, p2, p3) ||
    segmentsCross(a, b, p3, p4) ||
    segmentsCross(a, b, p4, p1)
  );
}

export function hasLineOfSight(from, to, blockers) {
  for (const b of blockers) {
    if (segmentRectHit(from, to, b)) return false;
  }
  return true;
}

export function inWedge(origin, facing, halfAngle, range, target, blockers) {
  const d = sub(target, origin);
  const distance = len(d);
  if (distance > range || distance < 1) return false;
  if (angleDiff(facing, Math.atan2(d.y, d.x)) > halfAngle) return false;
  return hasLineOfSight(origin, target, blockers);
}

export function wedgePolygon(origin, facing, halfAngle, range, steps = 14) {
  const pts = [v(origin.x, origin.y)];
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfAngle + (i / steps) * halfAngle * 2;
    pts.push(v(origin.x + Math.cos(a) * range, origin.y + Math.sin(a) * range));
  }
  return pts;
}

export function rectCenter(r) {
  return v(r.x + r.w / 2, r.y + r.h / 2);
}

export function pathLength(points) {
  let n = 0;
  for (let i = 1; i < points.length; i++) n += dist(points[i - 1], points[i]);
  return n;
}
