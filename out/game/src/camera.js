// Ceiling cameras: fixed arcs sweeping on a sine timer, seeded phase per room.

import { TUNE } from './config.js';

export function createCameras(room) {
  return room.cameras.map((c) => ({
    ...c,
    angle: c.base,
    range: TUNE.cameraRange,
    halfAngle: TUNE.cameraHalfAngle,
  }));
}

export function updateCameras(cameras, time) {
  for (const cam of cameras) {
    cam.angle = cam.base + Math.sin(time * 1.05 + cam.phase) * TUNE.cameraSweep;
  }
}

export function cameraAngle(cam, time) {
  return cam.base + Math.sin(time * 1.05 + cam.phase) * TUNE.cameraSweep;
}
