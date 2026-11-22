// Entry point: scene switching, fixed-step loop, input routing and screenshot staging.
import { SCREEN, beginRoom, createState, restartRoom, stageCover, stageEndShot, stagePlayShot, startRun, stepPlay, say } from './state.js';
import { STEP, TUNE } from './config.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { createAudio } from './audio.js';
import { buyTool, hasTool } from './inventory.js';
import { toolByKey } from './tools.js';
import { shopSlotRects } from './screens.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : TUNE.seed;
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
let state = createState(seed);
const renderer = createRenderer(canvas);
const input = createInput(canvas, renderer.view);
const audio = createAudio();

window.addEventListener('keydown', () => audio.unlock(), { once: false });
canvas.addEventListener('pointerdown', () => audio.unlock());

function announce(message) {
  status.textContent = message;
}

function playEvents(events) {
  for (const event of events) {
    switch (event.type) {
      case 'step': audio.footstep(event.soft); break;
      case 'tool': say(state, event.message); audio.chirp(); break;
      case 'door': audio.thud(); break;
      case 'ledger': audio.pickup(); announce('Marrow Ledger secured.'); break;
      case 'loot': audio.pickup(); break;
      case 'alert': audio.alert(); announce('Patrol alerted.'); break;
      case 'caught': audio.fail(); announce(`Caught by ${state.caughtBy}. Press R to restart the room.`); break;
      case 'advance': audio.pickup(); announce(`Entering ${state.room.name}.`); break;
      case 'success': audio.success(); announce(`Job complete. Score ${state.results.total}.`); break;
      default: break;
    }
  }
}

function selectFromKey(code) {
  const tool = toolByKey(code.replace('Digit', ''));
  if (tool) {
    state.belt.selected = tool.id;
    say(state, tool.kind === 'passive' ? `${tool.name} SELECTED — PASSIVE` : `${tool.name} SELECTED — CLICK TO USE`, 1.8);
  }
}

function handleInput() {
  const pressed = input.takePressed();
  const click = input.takeClick();
  if (pressed.length || click) audio.unlock();

  if (state.screen === SCREEN.title) {
    if (pressed.includes('Enter') || pressed.includes('Space') || click) {
      startRun(state);
      announce('Tool belt. Buy tools, then press Enter.');
    }
    return;
  }
  if (state.screen === SCREEN.shop) {
    for (const code of pressed) if (code.startsWith('Digit')) selectFromKey(code);
    if (click) {
      const slot = shopSlotRects().findIndex((r) => click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h);
      if (slot >= 0) {
        const tool = toolByKey(String(slot + 1));
        if (tool) say(state, buyTool(state.belt, tool.id).message);
      }
    }
    if (pressed.includes('Enter')) {
      beginRoom(state);
      announce(`Room ${state.roomIndex + 1}. ${state.room.name}.`);
    }
    return;
  }
  if (state.screen === SCREEN.results) {
    if (pressed.includes('Enter') || pressed.includes('Space') || click) startRun(state);
    return;
  }
  if (state.screen === SCREEN.caught) {
    if (pressed.includes('KeyR') || pressed.includes('Enter')) {
      restartRoom(state);
      announce('Room restarted.');
    }
    return;
  }
  if (state.screen === SCREEN.paused) {
    if (pressed.includes('KeyP') || pressed.includes('Enter')) state.screen = SCREEN.play;
    else if (pressed.includes('KeyR')) restartRoom(state);
    return;
  }
  for (const code of pressed) {
    if (code.startsWith('Digit')) selectFromKey(code);
    else if (code === 'KeyP' || code === 'Escape') { state.screen = SCREEN.paused; return; }
    else if (code === 'KeyR') { restartRoom(state); return; }
  }
  if (click && click.y >= 758 && click.y <= 792 && click.x >= 302 && click.x <= 1092) {
    const slot = Math.floor((click.x - 302) / 158);
    if (slot >= 0 && slot < 5) {
      selectFromKey(String(slot + 1));
      return;
    }
  }
  state.pendingInteract = pressed.includes('KeyE');
  state.pendingClick = click;
}

function frameStep() {
  const axis = input.axis();
  const control = {
    dx: axis.dx,
    dy: axis.dy,
    sprint: input.isDown('ShiftLeft') || input.isDown('ShiftRight'),
    crouch: input.isDown('KeyC'),
    interact: Boolean(state.pendingInteract),
    click: state.pendingClick,
  };
  state.pendingInteract = false;
  state.pendingClick = null;
  playEvents(stepPlay(state, STEP, control));
}

if (shot === 'start' || shot === 'play' || shot === 'end') {
  if (shot === 'play') stagePlayShot(state);
  else if (shot === 'end') stageEndShot(state);
  else stageCover(state);
  let painted = 0;
  function paintShot() {
    renderer.draw(state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paintShot);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paintShot);
} else {
  let accumulator = 0;
  let last = performance.now();
  function frame(now) {
    try {
      requestAnimationFrame(frame);
      accumulator += Math.min(0.25, (now - last) / 1000);
      last = now;
      handleInput();
      if (state.screen === SCREEN.play) {
        while (accumulator >= STEP && state.screen === SCREEN.play) {
          frameStep();
          accumulator -= STEP;
        }
      } else accumulator = 0;
      renderer.draw(state);
    } catch (error) {
      console.error('Blueprint reset after error:', error);
      state = createState(seed);
      accumulator = 0;
      input.clear();
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === SCREEN.play) state.screen = SCREEN.paused;
  });
  announce('Blueprint: The Marrow Job. Press Enter to begin.');
  requestAnimationFrame(frame);
}
