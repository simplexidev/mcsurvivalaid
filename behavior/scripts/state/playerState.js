import { world } from "@minecraft/server";
import { getPlayerStateKey } from "./storageKeys.js";

export function createDefaultPlayerState() {
  return {
    enabled: false,

    classTrack: {
      currentClass: null,
      completedClasses: [],
      classTrackStartDay: 0,
      lastDeathDay: 0,
      claimedClassRewardDays: [],
      pendingClassRewardDays: [],
      nextClassChangePromptDay: 20
    },

    deaths: {
      lastDeathLocation: null
    },

    chest: {
      placed: false,
      location: null
    },

    requests: {
      active: []
    },

    quests: {
      travel: {},
      blocksBroken: {},
      blocksPlaced: {},
      combat: {},
      claimedQuestRewards: [],
      pendingQuestRewards: []
    },

    settings: {
      showHud: true,
      showDaysSurvived: true,
      showDaysUntilReward: true,
      chestChangesTexture: true,
      allowTeleportToDeath: true,
      allowTeleportToRespawn: true
    }
  };
}

export function getPlayerState(player) {
  const raw = world.getDynamicProperty(getPlayerStateKey(player));

  if (typeof raw !== "string" || raw.length === 0) {
    return createDefaultPlayerState();
  }

  try {
    return {
      ...createDefaultPlayerState(),
      ...JSON.parse(raw)
    };
  } catch {
    return createDefaultPlayerState();
  }
}

export function setPlayerState(player, state) {
  world.setDynamicProperty(getPlayerStateKey(player), JSON.stringify(state));
}

export function updatePlayerState(player, updater) {
  const state = getPlayerState(player);
  const updated = updater(state) ?? state;
  setPlayerState(player, updated);
  return updated;
}