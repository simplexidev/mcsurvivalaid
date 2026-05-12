import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { giveStarterItems } from "./firstSpawnForms.js";
import { logger } from "../logging/logger.js";
import { showDeveloperMenu } from "./developerMenu.js";
import { safeShow } from "./safeShow.js";
import { getBooleanField, getNumberField } from "./formValues.js";

const LOG_LEVELS = ["trace", "info", "warn", "error"];

export async function showSettingsMenu(player) {
  const root = new ActionFormData().title("Survival Aid Settings").button("Gameplay Settings").button("Recover Starter Items").button(`Content Log Level: ${logger.getLogLevel()}`)
    .button("Developer Tools");
  const rootResult = await safeShow(root, player, "settingsMenu", "root");
  if (rootResult.canceled || rootResult.selection === undefined) { logger.trace("settingsMenu", "Settings root canceled", { playerId: player.id }); return; }
  if (rootResult.selection === 1) {
    giveStarterItems(player);
    player.sendMessage("Starter items re-issued (if inventory has space).");
    logger.info("settingsMenu", "Starter items re-issued from settings menu", { playerId: player.id });
    return;
  }
  if (rootResult.selection === 2) {
    await showLoggingLevelMenu(player);
    return;
  }
  if (rootResult.selection === 3) {
    await showDeveloperMenu(player);
    return;
  }
  const state = getPlayerState(player);
  const form = new ModalFormData().title("Survival Aid Settings")
    .toggle("Show HUD", { defaultValue: state.settings.showHud })
    .toggle("Show Days Survived", { defaultValue: state.settings.showDaysSurvived })
    .toggle("Show Days Until Reward", { defaultValue: state.settings.showDaysUntilReward })
    .toggle("Show Reward Availability", { defaultValue: state.settings.showRewardReady })
    .toggle("Chest Changes Texture", { defaultValue: state.settings.chestChangesTexture })
    .toggle("Allow Teleport to Respawn", { defaultValue: state.settings.allowTeleportToRespawn })
    .toggle("Allow Teleport to Last Death", { defaultValue: state.settings.allowTeleportToDeath })
    .slider("Teleport Cooldown (sec)", 10, 600, { defaultValue: state.settings.teleportCooldownSeconds });
  const result = await safeShow(form, player, "settingsMenu", "gameplay_settings");
  if (result.canceled || !result.formValues) { logger.trace("settingsMenu", "Gameplay settings canceled", { playerId: player.id }); return; }
  const showHud = getBooleanField(result.formValues, 0, state.settings.showHud);
  const showDaysSurvived = getBooleanField(result.formValues, 1, state.settings.showDaysSurvived);
  const showDaysUntilReward = getBooleanField(result.formValues, 2, state.settings.showDaysUntilReward);
  const showRewardReady = getBooleanField(result.formValues, 3, state.settings.showRewardReady);
  const chestChangesTexture = getBooleanField(result.formValues, 4, state.settings.chestChangesTexture);
  const allowTeleportToRespawn = getBooleanField(result.formValues, 5, state.settings.allowTeleportToRespawn);
  const allowTeleportToDeath = getBooleanField(result.formValues, 6, state.settings.allowTeleportToDeath);
  const teleportCooldownSeconds = Math.floor(getNumberField(result.formValues, 7, state.settings.teleportCooldownSeconds));
  Object.assign(state.settings,{showHud,showDaysSurvived,showDaysUntilReward,showRewardReady,chestChangesTexture,allowTeleportToRespawn,allowTeleportToDeath,teleportCooldownSeconds});
  setPlayerState(player,state);
  logger.info("settingsMenu", "Player settings updated", { playerId: player.id, settings: state.settings });
  player.sendMessage("Survival Aid settings updated.");
}

async function showLoggingLevelMenu(player) {
  const current = logger.getLogLevel();
  const form = new ActionFormData().title("Content Log Level").body("Choose how verbose the Survival Aid content log should be.");
  for (const level of LOG_LEVELS) form.button(level === current ? `${level} (current)` : level);
  const result = await safeShow(form, player, "settingsMenu", "logging_level");
  if (result.canceled || result.selection === undefined) return;
  const selected = LOG_LEVELS[result.selection];
  if (!selected || !logger.setLogLevel(selected)) return;
  logger.info("settingsMenu", "Log level updated", { playerId: player.id, selected });
  player.sendMessage(`Survival Aid content log level set to ${selected}.`);
}
