import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerState } from "../state/playerState.js";
import { getCurrentWorldDay, hasPendingRewards } from "../rewards/rewardService.js";
import { getNextClassRewardDay } from "../rewards/rewardSchedule.js";
import { showSettingsMenu } from "./settingsMenu.js";
import { showDocumentationMenu } from "./documentationMenu.js";
import { teleportToRespawn, teleportToLastDeath } from "../teleport/teleportService.js";
import { showStructureLocatorMenu } from "../structures/structureLocator.js";
import { showItemRequestsMenu } from "../items/requestService.js";
import { safeShow } from "./safeShow.js";

const lastHudText = new Map();

export async function showBookOfSurvivalMenu(player) {
  const form = new ActionFormData()
    .title("Book of Survival")
    .body("Choose an option.")
    .button("Structure Locator")
    .button("Item Requests")
    .button("Teleport to Respawn")
    .button("Teleport to Last Death")
    .button("In-Game Documentation")
    .button("Add-On Settings");

  const result = await safeShow(form, player, "bookOfSurvivalMenu", "root");

  if (result.canceled || result.selection === undefined) {
    return;
  }

  switch (result.selection) {
    case 0:
      await showStructureLocatorMenu(player);
      break;

    case 1:
      await showItemRequestsMenu(player);
      break;

    case 2:
      teleportToRespawn(player);
      break;

    case 3:
      teleportToLastDeath(player);
      break;

    case 4:
      await showDocumentationMenu(player);
      break;

    case 5:
      await showSettingsMenu(player);
      break;
  }
}

export function updateHudForAllPlayers() {
  for (const player of world.getPlayers()) {
    const state = getPlayerState(player);

    if (!state.enabled || !state.settings.showHud) {
      continue;
    }

    const worldDay = getCurrentWorldDay();
    const daysSurvived = Math.max(0, worldDay - state.classTrack.lastDeathDay);
    const classTrackDays = Math.max(0, worldDay - state.classTrack.classTrackStartDay);
    const nextRewardDay = getNextClassRewardDay(
      classTrackDays,
      state.classTrack.claimedClassRewardDays,
      state.classTrack.pendingClassRewardDays
    );
    const rewardReady = hasPendingRewards(player);

    const parts = [];

    if (state.settings.showDaysSurvived) {
      parts.push(`Days Survived: ${daysSurvived}`);
    }

    if (state.settings.showDaysUntilReward) {
      parts.push(`Days Until Reward: ${Math.max(0, nextRewardDay - classTrackDays)}`);
    }

    if (state.settings.showRewardReady) {
      parts.push(`Reward Ready: ${rewardReady ? "Yes" : "No"}`);
    }

    const text = parts.join(" | ");
    if (lastHudText.get(player.id) !== text) {
      player.onScreenDisplay.setActionBar(text);
      lastHudText.set(player.id, text);
    }
  }
}
