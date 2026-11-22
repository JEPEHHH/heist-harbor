// Keyboard and pointer input. Presses are queued so no tap between frames is lost.

import { CANVAS } from './config.js';

const HELD_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'KeyC', 'KeyE',
]);
const ONE_SHOTS = new Set([
  'Enter', 'Space', 'KeyE', 'KeyP', 'KeyR', 'Escape', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
]);

export function createInput(canvas, view) {
  const held = new Set();
  const pressed = new Set();
  const pointer = { x: CANVAS.w / 2, y: CANVAS.h / 2, click: null };

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS.w,
      y: ((clientY - rect.top) / rect.height) * CANVAS.h,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (HELD_KEYS.has(event.code) || ONE_SHOTS.has(event.code)) {
      event.preventDefault();
      held.add(event.code);
      if (!event.repeat && ONE_SHOTS.has(event.code)) pressed.add(event.code);
    }
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => { held.clear(); pressed.clear(); });
  canvas.addEventListener('pointermove', (event) => {
    const p = toLogical(event.clientX, event.clientY);
    pointer.x = p.x; pointer.y = p.y;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const p = toLogical(event.clientX, event.clientY);
    pointer.x = p.x; pointer.y = p.y;
    pointer.click = { x: p.x, y: p.y };
    pressed.add('Mouse');
    event.preventDefault();
  });

  return {
    toLogical,
    pointer,
    axis() {
      const dx = (held.has('KeyD') || held.has('ArrowRight') ? 1 : 0) - (held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0);
      const dy = (held.has('KeyS') || held.has('ArrowDown') ? 1 : 0) - (held.has('KeyW') || held.has('ArrowUp') ? 1 : 0);
      return { dx, dy };
    },
    isDown(code) { return held.has(code); },
    takePressed() {
      const out = [...pressed];
      pressed.clear();
      return out;
    },
    takeClick() {
      const c = pointer.click;
      pointer.click = null;
      return c;
    },
    clear() { held.clear(); pressed.clear(); pointer.click = null; },
  };
}
