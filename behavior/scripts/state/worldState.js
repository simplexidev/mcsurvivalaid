import { world, system } from "@minecraft/server";
import { STORAGE_KEYS } from "./storageKeys.js";

export function createDefaultWorldState() {
  return {
    stateVersion: 1,
    initialized: true,
    createdAtTick: system.currentTick,
    notes: [],
    knownStructures: {}
  };
}

export function getWorldState() {
  const raw = world.getDynamicProperty(STORAGE_KEYS.worldState);
  if (typeof raw !== "string" || raw.length === 0) return createDefaultWorldState();
  try {
    const parsed = JSON.parse(raw);
    return { ...createDefaultWorldState(), ...parsed, knownStructures: { ...(parsed.knownStructures ?? {}) } };
  } catch {
    return createDefaultWorldState();
  }
}

export function ensureWorldStateInitialized() {
  const current = getWorldState();
  world.setDynamicProperty(STORAGE_KEYS.worldState, JSON.stringify(current));
  return current;
}

export function setWorldState(state) {
  world.setDynamicProperty(STORAGE_KEYS.worldState, JSON.stringify(state));
}

export function registerKnownStructure(type, dimension, x, y, z) {
  const s = getWorldState();
  if (!s.knownStructures[type]) s.knownStructures[type] = [];
  s.knownStructures[type].push({ dimension, x: Math.floor(x), y: Math.floor(y), z: Math.floor(z), tick: system.currentTick });
  s.knownStructures[type] = s.knownStructures[type].slice(-32);
  setWorldState(s);
}

export function findNearestKnownStructure(type, dimension, x, z) {
  const s = getWorldState();
  const list = (s.knownStructures[type] ?? []).filter(e => e.dimension === dimension);
  if (list.length === 0) return null;
  let best = null, bestD = Infinity;
  for (const e of list) {
    const d = Math.hypot(e.x - x, e.z - z);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}
