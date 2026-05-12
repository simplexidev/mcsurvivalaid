import type { Player } from "@minecraft/server";
import { world } from "@minecraft/server";
import { getPlayerStateKey } from "./storageKeys.js";
import { logger } from "../logging/logger.js";
import type { PlayerState } from "../types/domain.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asObject(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : {};
}

export function createDefaultPlayerState(): PlayerState {
  return {
    stateVersion: 1,
    hasSeenInitialPrompt: false,
    enabled: false,
    classTrack: {
      currentClass: null,
      completedClasses: [],
      classTrackStartDay: 0,
      lastDeathDay: 0,
      claimedClassRewardDays: [],
      pendingClassRewardDays: [],
      partialClassRewards: {},
      nextClassChangePromptDay: 20,
      tier5ClaimedCurrent: false,
    },
    deaths: { lastDeathLocation: null, respawnLocation: null },
    chest: { placed: false, location: null },
    requests: { active: [] },
    quests: {
      travel: {},
      blocksBroken: {},
      blocksPlaced: {},
      combat: {},
      claimedQuestRewards: [],
      pendingQuestRewards: [],
    },
    cooldowns: { respawnTeleportReadyTick: 0, deathTeleportReadyTick: 0 },
    settings: {
      showHud: true,
      showDaysSurvived: true,
      showDaysUntilReward: true,
      showRewardReady: true,
      chestChangesTexture: true,
      allowTeleportToDeath: true,
      allowTeleportToRespawn: true,
      teleportCooldownSeconds: 60,
    },
  };
}

export function getPlayerState(player: Player): PlayerState {
  const raw = world.getDynamicProperty(getPlayerStateKey(player));
  if (typeof raw !== "string" || raw.length === 0) {
    logger.trace("playerState", "No saved state, using defaults", { playerId: player.id });
    return createDefaultPlayerState();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return createDefaultPlayerState();
    const d = createDefaultPlayerState();
    return {
      ...d,
      ...parsed,
      classTrack: { ...d.classTrack, ...asObject(parsed.classTrack) },
      deaths: { ...d.deaths, ...asObject(parsed.deaths) },
      chest: { ...d.chest, ...asObject(parsed.chest) },
      requests: { ...d.requests, ...asObject(parsed.requests) },
      quests: { ...d.quests, ...asObject(parsed.quests) },
      cooldowns: { ...d.cooldowns, ...asObject(parsed.cooldowns) },
      settings: { ...d.settings, ...asObject(parsed.settings) },
    };
  } catch (error: unknown) {
    logger.warn("playerState", "Failed to parse player state; using defaults", {
      playerId: player.id,
      error: String(error),
    });
    return createDefaultPlayerState();
  }
}

export function setPlayerState(player: Player, state: PlayerState): void {
  world.setDynamicProperty(getPlayerStateKey(player), JSON.stringify(state));
  logger.trace("playerState", "Player state saved", { playerId: player.id });
}
export function updatePlayerState(
  player: Player,
  updater: (state: PlayerState) => PlayerState | undefined
): PlayerState {
  const state = getPlayerState(player);
  const updated = updater(state) ?? state;
  setPlayerState(player, updated);
  return updated;
}
