import { world, system } from "@minecraft/server";
import { STORAGE_KEYS } from "./storageKeys.js";

export function createDefaultWorldState() {
  return {
    stateVersion: 1,
    initialized: true,
    createdAtTick: system.currentTick,
    notes: []
  };
}

export function getWorldState() {
  const raw = world.getDynamicProperty(STORAGE_KEYS.worldState);
  if (typeof raw !== "string" || raw.length === 0) return createDefaultWorldState();
  try {
    return { ...createDefaultWorldState(), ...JSON.parse(raw) };
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
