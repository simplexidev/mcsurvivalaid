import { world, system } from "@minecraft/server";
import { STORAGE_KEYS } from "./storageKeys.js";
import { logger } from "../logging/logger.js";

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
  if (typeof raw !== "string" || raw.length === 0) { logger.info("worldState", "No world state found; creating default state"); return createDefaultWorldState(); }
  try {
    const parsed = JSON.parse(raw);
    return migrateWorldState({ ...createDefaultWorldState(), ...parsed, knownStructures: { ...(parsed.knownStructures ?? {}) } });
  } catch (error) {
    logger.error("worldState", "Failed to parse world state; creating defaults", { error: String(error) });
    return createDefaultWorldState();
  }
}

export function ensureWorldStateInitialized() {
  const current = getWorldState();
  setWorldState(current);
  logger.info("worldState", "World state initialized", { stateVersion: current.stateVersion });
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
  logger.trace("worldState", "Registered known structure", { type, dimension, x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) });
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
