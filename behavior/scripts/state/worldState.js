import { world, system } from "@minecraft/server";
import { STORAGE_KEYS } from "./storageKeys.js";

const WORLD_STATE_VERSION = 2;

export function createDefaultWorldState() {
  return {
    stateVersion: WORLD_STATE_VERSION,
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
    return migrateWorldState({ ...createDefaultWorldState(), ...parsed, knownStructures: { ...(parsed.knownStructures ?? {}) } });
  } catch {
    return createDefaultWorldState();
  }
}

export function ensureWorldStateInitialized() {
  const current = getWorldState();
  setWorldState(current);
  return current;
}

export function setWorldState(state) {
  world.setDynamicProperty(STORAGE_KEYS.worldState, JSON.stringify(state));
}

function migrateWorldState(state) {
  let current = { ...state };
  if (!current.stateVersion || current.stateVersion < 2) {
    current.knownStructures = normalizeKnownStructures(current.knownStructures ?? {});
    current.stateVersion = 2;
    current.notes = [...(current.notes ?? []), "migrated_to_v2_known_structure_normalization"];
  } else {
    current.knownStructures = normalizeKnownStructures(current.knownStructures ?? {});
  }
  return current;
}

function normalizeKnownStructures(knownStructures) {
  const out = {};
  for (const [type, entries] of Object.entries(knownStructures)) {
    const seen = new Set();
    out[type] = (entries ?? [])
      .filter(Boolean)
      .map(e => ({ dimension: e.dimension, x: Math.floor(e.x), y: Math.floor(e.y), z: Math.floor(e.z), tick: Number(e.tick ?? 0) }))
      .filter(e => {
        const key = `${e.dimension}:${e.x}:${e.y}:${e.z}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(-32);
  }
  return out;
}

export function registerKnownStructure(type, dimension, x, y, z) {
  const s = getWorldState();
  if (!s.knownStructures[type]) s.knownStructures[type] = [];
  s.knownStructures[type].push({ dimension, x: Math.floor(x), y: Math.floor(y), z: Math.floor(z), tick: system.currentTick });
  s.knownStructures = normalizeKnownStructures(s.knownStructures);
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
