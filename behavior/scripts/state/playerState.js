import { world } from "@minecraft/server";
import { getPlayerStateKey } from "./storageKeys.js";
import { logger } from "../logging/logger.js";

export function createDefaultPlayerState() {
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
      tier5ClaimedCurrent: false
    },
    deaths: { lastDeathLocation: null, respawnLocation: null },
    chest: { placed: false, location: null },
    requests: { active: [] },
    quests: { travel: {}, blocksBroken: {}, blocksPlaced: {}, combat: {}, claimedQuestRewards: [], pendingQuestRewards: [] },
    cooldowns: { respawnTeleportReadyTick: 0, deathTeleportReadyTick: 0 },
    settings: {
      showHud: true, showDaysSurvived: true, showDaysUntilReward: true, showRewardReady: true,
      chestChangesTexture: true, allowTeleportToDeath: true, allowTeleportToRespawn: true,
      teleportCooldownSeconds: 60
    }
  };
}

export function getPlayerState(player) {
  const raw = world.getDynamicProperty(getPlayerStateKey(player));
  if (typeof raw !== "string" || raw.length === 0) { logger.trace("playerState", "No saved state, using defaults", { playerId: player.id }); return createDefaultPlayerState(); }
  try {
    const parsed = JSON.parse(raw);
    const d = createDefaultPlayerState();
    return { ...d, ...parsed, classTrack: { ...d.classTrack, ...(parsed.classTrack ?? {}) }, deaths: { ...d.deaths, ...(parsed.deaths ?? {}) }, chest: { ...d.chest, ...(parsed.chest ?? {}) }, requests: { ...d.requests, ...(parsed.requests ?? {}) }, quests: { ...d.quests, ...(parsed.quests ?? {}) }, cooldowns: { ...d.cooldowns, ...(parsed.cooldowns ?? {}) }, settings: { ...d.settings, ...(parsed.settings ?? {}) } };
  } catch (error) { logger.warn("playerState", "Failed to parse player state; using defaults", { playerId: player.id, error: String(error) }); return createDefaultPlayerState(); }
}

export function setPlayerState(player, state) { world.setDynamicProperty(getPlayerStateKey(player), JSON.stringify(state)); logger.trace("playerState", "Player state saved", { playerId: player.id }); }
export function updatePlayerState(player, updater) { const state = getPlayerState(player); const updated = updater(state) ?? state; setPlayerState(player, updated); return updated; }
