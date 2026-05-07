import { world } from "@minecraft/server";
import { STORAGE_KEYS } from "./storageKeys.js";

export function createDefaultWorldState() {
  return {
    initialized: true,
    createdAtTick: systemCurrentTickSafe(),
    notes: []
  };
}

export function getWorldState() {
  const raw = world.getDynamicProperty(STORAGE_KEYS.worldState);

  if (typeof raw !== "string" || raw.length === 0) {
    return createDefaultWorldState();
  }

  try {
    return {
      ...createDefaultWorldState(),
      ...JSON.parse(raw)
    };
  } catch {
    return createDefaultWorldState();
  }
}

export function setWorldState(state) {
  world.setDynamicProperty(STORAGE_KEYS.worldState, JSON.stringify(state));
}

function systemCurrentTickSafe() {
  try {
    return system.currentTick;
  } catch {
    return 0;
  }
}