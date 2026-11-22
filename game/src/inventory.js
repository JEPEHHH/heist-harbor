// Credits, tool purchases and the selected belt slot. Each room grants a fresh 120-credit budget.

import { TUNE } from './config.js';
import { TOOLS, toolById } from './tools.js';

export function createBelt() {
  return {
    credits: TUNE.baseBudget,
    spent: 0,
    owned: { cutters: false, cloner: false, shoes: false },
    counts: { smoke: 0, decoy: 0 },
    selected: 'cutters',
  };
}

export function grantRoomBudget(belt) {
  belt.credits = TUNE.baseBudget;
}

export function hasTool(belt, id) {
  return Boolean(belt.owned[id]) || belt.counts[id] > 0;
}

export function consumeTool(belt, id) {
  if (belt.counts[id] > 0) belt.counts[id] -= 1;
}

export function buyTool(belt, id) {
  const tool = toolById(id);
  if (belt.credits < tool.cost) return { ok: false, message: 'INSUFFICIENT CREDITS' };
  if (tool.kind === 'passive' && belt.owned[id]) return { ok: false, message: 'ALREADY OWNED' };
  belt.credits -= tool.cost;
  belt.spent += tool.cost;
  if (tool.kind === 'passive') belt.owned[id] = true;
  else belt.counts[id] += 1;
  belt.selected = id;
  return { ok: true, message: `${tool.name} ACQUIRED` };
}

export function beltSlots(belt) {
  return TOOLS.map((tool) => ({
    ...tool,
    available: tool.kind === 'passive' ? belt.owned[tool.id] : belt.counts[tool.id] > 0,
    affordable: belt.credits >= tool.cost,
    count: tool.kind === 'passive' ? (belt.owned[tool.id] ? 1 : 0) : belt.counts[tool.id],
    selected: belt.selected === tool.id,
  }));
}
