import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { giveStarterItems } from "./firstSpawnForms.js";

export async function showSettingsMenu(player) {
  const root = new ActionFormData().title("Survival Aid Settings").button("Gameplay Settings").button("Recover Starter Items");
  const rootResult = await root.show(player);
  if (rootResult.canceled || rootResult.selection === undefined) return;
  if (rootResult.selection === 1) {
    giveStarterItems(player);
    player.sendMessage("Starter items re-issued (if inventory has space).");
    return;
  }
  const state = getPlayerState(player);
  const form = new ModalFormData().title("Survival Aid Settings")
    .toggle("Show HUD", state.settings.showHud)
    .toggle("Show Days Survived", state.settings.showDaysSurvived)
    .toggle("Show Days Until Reward", state.settings.showDaysUntilReward)
    .toggle("Show Reward Availability", state.settings.showRewardReady)
    .toggle("Chest Changes Texture", state.settings.chestChangesTexture)
    .toggle("Allow Teleport to Respawn", state.settings.allowTeleportToRespawn)
    .toggle("Allow Teleport to Last Death", state.settings.allowTeleportToDeath)
    .slider("Teleport Cooldown (sec)", 10, 600, 10, state.settings.teleportCooldownSeconds);
  const result = await form.show(player);
  if (result.canceled || !result.formValues) return;
  const [showHud,showDaysSurvived,showDaysUntilReward,showRewardReady,chestChangesTexture,allowTeleportToRespawn,allowTeleportToDeath,teleportCooldownSeconds] = result.formValues;
  Object.assign(state.settings,{showHud,showDaysSurvived,showDaysUntilReward,showRewardReady,chestChangesTexture,allowTeleportToRespawn,allowTeleportToDeath,teleportCooldownSeconds:Math.floor(teleportCooldownSeconds)});
  setPlayerState(player,state);
  player.sendMessage("Survival Aid settings updated.");
}
