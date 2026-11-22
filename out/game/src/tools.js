// Tool definitions, costs and click effects. Passive tools are applied in state/interaction.

import { TUNE } from './config.js';

export const TOOLS = [
  { id: 'cutters', key: '1', name: 'BOLT CUTTER', cost: 30, kind: 'passive', note: 'Spring the vault cage instantly. E at cage.' },
  { id: 'cloner', key: '2', name: 'CARD CLONER', cost: 35, kind: 'passive', note: 'Open CARD-01 instantly. E at door.' },
  { id: 'smoke', key: '3', name: 'SMOKE CAN', cost: 25, kind: 'thrown', note: 'Click: blinds every cone for 4s.' },
  { id: 'decoy', key: '4', name: 'RADIO DECOY', cost: 25, kind: 'thrown', note: 'Click: lures the nearest guard.' },
  { id: 'shoes', key: '5', name: 'SOFT SHOES', cost: 20, kind: 'passive', note: 'Halves footstep investigation noise.' },
];

export function toolById(id) {
  return TOOLS.find((t) => t.id === id) ?? TOOLS[0];
}

export function toolByKey(key) {
  return TOOLS.find((t) => t.key === key) ?? null;
}

/** Use the selected tool at a clicked point. Returns a short message for the HUD. */
export function useTool(state, point) {
  const tool = toolById(state.belt.selected);
  if (tool.kind === 'passive') return `${tool.name} IS PASSIVE — PRESS E WHEN IN RANGE`;
  if (!state.belt.counts[tool.id]) return `NO ${tool.name} — BUY IT IN THE TOOL BELT`;
  const p = point ?? state.thief;
  if (tool.id === 'smoke') {
    state.belt.counts.smoke -= 1;
    state.smokes.push({ x: p.x, y: p.y, life: TUNE.smokeDuration, max: TUNE.smokeDuration, r: 62 });
    return 'SMOKE DEPLOYED — CONES BLINDED 4s';
  }
  if (tool.id === 'decoy') {
    state.belt.counts.decoy -= 1;
    let nearest = null;
    let best = Infinity;
    for (const g of state.guards) {
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d < best) { best = d; nearest = g; }
    }
    if (nearest) {
      nearest.decoy = { x: p.x, y: p.y, life: TUNE.decoyDuration };
      nearest.state = 'investigating';
    }
    state.decoyMark = { x: p.x, y: p.y, life: TUNE.decoyDuration };
    return 'RADIO DECOY — NEAREST GUARD LURED';
  }
  return 'TOOL NOT READY';
}
