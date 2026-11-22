// The three rooms as data: walls, cover, doors, vent duct, waypoints, cameras and loot.
// Coordinates are in the 1280x800 drawing; the alarm column occupies x>=1165.

import { ROOM_NAMES } from './config.js';

export const ARENA = { x: 64, y: 150, w: 1076, h: 560 };
export const FOYER = { x: 74, y: 160, w: 196, h: 540 };
export const VENT = { x: 278, y: 168, w: 664, h: 104 };
export const EXIT = { x: 1080, y: 606, w: 48, h: 84 };

const rect = (x, y, w, h, label = '') => ({ x, y, w, h, label });
const pt = (x, y) => ({ x, y });

// Shared shell: foyer on the left, three lanes, loading strip on the right.
const SHELL = [
  rect(64, 150, 1076, 10, 'NORTH WALL'),
  rect(64, 700, 1076, 10, 'SOUTH WALL'),
  rect(64, 150, 10, 560, 'WEST WALL'),
  rect(1130, 150, 10, 470, 'EAST WALL'),
  rect(1130, 690, 10, 10),
  rect(270, 284, 680, 10, 'VENT / CARD DIVIDER'),
  rect(270, 448, 680, 10, 'CARD / FLOOR DIVIDER'),
  rect(948, 150, 8, 34),
  rect(948, 272, 8, 38),
  rect(948, 440, 8, 30),
  rect(948, 690, 8, 10),
  rect(596, 294, 8, 54, 'CARD JAMB'),
  rect(596, 394, 8, 54, 'CARD JAMB'),
  rect(782, 314, 92, 8, 'CAGE TOP'),
  rect(782, 412, 92, 8, 'CAGE BASE'),
  rect(866, 314, 8, 106, 'CAGE EAST'),
  rect(782, 314, 4, 42, 'CAGE WEST'),
  rect(782, 392, 4, 28, 'CAGE WEST'),
];

const ROUTE_GUIDES = [
  { name: 'ROUTE A / VENT — SILENT', points: [pt(170, 220), pt(300, 220), pt(930, 220), pt(1000, 220), pt(1104, 640)] },
  { name: 'ROUTE B / CARD — CLONER', points: [pt(170, 370), pt(560, 370), pt(700, 370), pt(990, 370), pt(1104, 640)] },
  { name: 'ROUTE C / FLOOR — FAST', points: [pt(170, 570), pt(560, 570), pt(930, 570), pt(1104, 640)] },
];

const DOOR_TEMPLATES = [
  { id: 'card', kind: 'card', x: 596, y: 348, w: 8, h: 46, label: 'CARD-01', locked: true },
  { id: 'cage', kind: 'cage', x: 786, y: 356, w: 8, h: 36, label: 'CAGE', locked: true },
];

const CAMERA_POSITIONS = [
  { id: 'CAM-01', x: 506, y: 168, base: 1.57, phase: 0.2, label: 'CAM-01 120°' },
  { id: 'CAM-02', x: 872, y: 168, base: 1.57, phase: 2.3, label: 'CAM-02 120°' },
];

function makeRoom(index) {
  const variants = [
    {
      brief: 'Cross the records floor. Three ways through.',
      start: pt(168, 570),
      cover: [rect(424, 608, 64, 40, 'CRATE A'), rect(760, 574, 84, 34, 'SHELVING'), rect(1024, 468, 30, 30, 'PILLAR'), rect(686, 316, 62, 30, 'FILES')],
      guards: [
        [pt(336, 548), pt(558, 548), pt(558, 658), pt(336, 658)],
        [pt(654, 512), pt(900, 512), pt(900, 654), pt(654, 654)],
        [pt(986, 520), pt(1092, 520), pt(1092, 660), pt(986, 660)],
      ],
      loot: [rect(704, 620, 26, 20, 'LOOSE FILES'), rect(1036, 424, 26, 20, 'CASH BOX')],
      ledger: null,
    },
    {
      brief: 'The Marrow Ledger is in the vault cage. Steal it, then leave.',
      start: pt(168, 570),
      cover: [rect(386, 604, 60, 40, 'CRATE B'), rect(598, 496, 72, 30, 'SHELVING'), rect(962, 560, 58, 30, 'CRATE C'), rect(696, 318, 54, 28, 'FILES')],
      guards: [
        [pt(330, 540), pt(548, 540), pt(548, 660), pt(330, 660)],
        [pt(648, 606), pt(900, 606), pt(900, 674), pt(648, 674)],
        [pt(652, 400), pt(736, 400), pt(736, 434), pt(652, 434)],
      ],
      loot: [rect(500, 396, 26, 20, 'LOOSE FILES'), rect(1006, 620, 26, 20, 'CASH BOX')],
      ledger: pt(830, 374),
    },
    {
      brief: 'Last plan. Reach the van before the alarm column fills.',
      start: pt(168, 570),
      cover: [rect(420, 616, 62, 38, 'CRATE D'), rect(716, 590, 74, 30, 'PALLET'), rect(1010, 470, 30, 30, 'PILLAR'), rect(700, 320, 58, 28, 'FILES')],
      guards: [
        [pt(330, 552), pt(570, 552), pt(570, 668), pt(330, 668)],
        [pt(652, 512), pt(910, 512), pt(910, 660), pt(652, 660)],
        [pt(986, 512), pt(1096, 512), pt(1096, 672), pt(986, 672)],
      ],
      loot: [rect(360, 348, 26, 20, 'LOOSE FILES'), rect(800, 640, 26, 20, 'CASH BOX')],
      ledger: null,
    },
  ][index];

  return {
    index,
    name: ROOM_NAMES[index],
    brief: variants.brief,
    start: variants.start,
    exit: { ...EXIT },
    van: pt(1104, 648),
    walls: SHELL.map((w) => ({ ...w })),
    cover: variants.cover.map((c) => ({ ...c })),
    doors: DOOR_TEMPLATES.map((d) => ({ ...d })),
    routes: ROUTE_GUIDES,
    vent: { ...VENT },
    cameras: CAMERA_POSITIONS.map((c) => ({ ...c })),
    guards: variants.guards.map((waypoints) => waypoints.map((p) => ({ ...p }))),
    loot: variants.loot.map((l) => ({ ...l, id: l.label, value: l.label === 'CASH BOX' ? 220 : 130, taken: false })),
    ledger: variants.ledger ? { x: variants.ledger.x, y: variants.ledger.y, taken: false } : null,
    cage: rect(782, 314, 92, 106, 'VAULT CAGE'),
  };
}

export const ROOMS = [makeRoom(0), makeRoom(1), makeRoom(2)];

export function buildRoom(index) {
  return makeRoom(index);
}

export function solidRects(room) {
  return [...room.walls, ...room.cover, ...room.doors.filter((d) => d.locked).map((d) => rect(d.x, d.y, d.w, d.h, d.label))];
}

export function isInVent(room, p) {
  return p.x > room.vent.x && p.x < room.vent.x + room.vent.w && p.y > room.vent.y && p.y < room.vent.y + room.vent.h;
}
