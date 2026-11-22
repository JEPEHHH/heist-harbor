// BLUEPRINT: The Marrow Job — one place for canvas size, palette and tuning numbers.

export const CANVAS = { w: 1280, h: 800 };

export const PAPER = '#f4efe3';
export const INK = '#1c2a3a';
export const INK_FAINT = 'rgba(28,42,58,0.20)';
export const INK_GHOST = 'rgba(28,42,58,0.09)';
export const VERMILION = '#c8402c';
export const AMBER = '#c98a1b';

export const PALETTE = {
  paper: PAPER,
  ink: INK,
  inkFaint: INK_FAINT,
  inkGhost: INK_GHOST,
  red: VERMILION,
  amber: AMBER,
};

export const FONT = '"Courier New", Courier, monospace';
export const STEP = 1 / 60;

export const TUNE = {
  walkSpeed: 142,
  sprintSpeed: 238,
  crouchSpeed: 84,
  ventSpeed: 72,
  thiefRadius: 11,
  guardRadius: 12,
  guardWalk: 58,
  guardAlert: 106,
  guardTurnSpeed: 2.6,
  visionRange: 242,
  visionHalfAngle: 0.42,
  cameraRange: 292,
  cameraHalfAngle: 1.0472,
  cameraSweep: 0.62,
  alarmRiseGuard: 42,
  alarmRiseCamera: 34,
  alarmDecay: 9,
  alertThreshold: 40,
  failThreshold: 100,
  interactRange: 50,
  smokeDuration: 4,
  decoyDuration: 3.2,
  baseBudget: 120,
  seed: 0x5eed1707,
  totalTimeBonusCap: 600,
};

export const ROOM_NAMES = ['ARCHIVE HALL', 'LEDGER VAULT', 'LOADING BAY'];

export const TITLE_BLOCK_LINES = [
  'BLUEPRINT 07 — THE MARROW JOB · 1:50',
  'ONE FRAME: thief crawling, three guard cones, CAM-01/02 arcs, Marrow Ledger, alarm column, getaway van.',
];
