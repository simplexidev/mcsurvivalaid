import { ModalFormData } from "@minecraft/server-ui";
import { getPlayerState, setPlayerState } from "../state/playerState.js";

export async function showSettingsMenu(player) {
  const state = getPlayerState(player);

  const form = new ModalFormData()
    .title("Survival Aid Settings")
    .toggle("Show HUD", state.settings.showHud)
    .toggle("Show Days Survived", state.settings.showDaysSurvived)
    .toggle("Show Days Until Reward", state.settings.showDaysUntilReward)
    .toggle("Chest Changes Texture", state.settings.chestChangesTexture)
    .toggle("Allow Teleport to Respawn", state.settings.allowTeleportToRespawn)
    .toggle("Allow Teleport to Last Death", state.settings.allowTeleportToDeath);

  const result = await form.show(player);

  if (result.canceled || !result.formValues) {
    return;
  }

  const [
    showHud,
    showDaysSurvived,
    showDaysUntilReward,
    chestChangesTexture,
    allowTeleportToRespawn,
    allowTeleportToDeath
  ] = result.formValues;

  state.settings.showHud = showHud;
  state.settings.showDaysSurvived = showDaysSurvived;
  state.settings.showDaysUntilReward = showDaysUntilReward;
  state.settings.chestChangesTexture = chestChangesTexture;
  state.settings.allowTeleportToRespawn = allowTeleportToRespawn;
  state.settings.allowTeleportToDeath = allowTeleportToDeath;

  setPlayerState(player, state);

  player.sendMessage("Survival Aid settings updated.");
}