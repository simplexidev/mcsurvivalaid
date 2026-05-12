import type { Player } from "@minecraft/server";
import { StorageKey } from "../types/domain.js";

export const STORAGE_KEYS = {
  playerStatePrefix: StorageKey.PlayerStatePrefix,
  worldState: StorageKey.WorldState
} as const;

export function getPlayerStateKey(player: Player): string {
  return `${STORAGE_KEYS.playerStatePrefix}${player.id}`;
}
