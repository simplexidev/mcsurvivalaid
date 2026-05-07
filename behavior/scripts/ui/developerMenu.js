import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { world } from "@minecraft/server";
import { logger } from "../logging/logger.js";

export async function showDeveloperMenu(player) {
  const form = new ActionFormData()
    .title("Developer Tools")
    .body("Fast testing tools. All actions are logged.")
    .button("Skip Days")
    .button("Set Respawn Here")
    .button("Kill Player Instantly");

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) {
    logger.trace("developerMenu", "Developer menu canceled", { playerId: player.id });
    return;
  }

  switch (result.selection) {
    case 0:
      await showSkipDaysMenu(player);
      return;
    case 1:
      await setRespawnHere(player);
      return;
    case 2:
      await killPlayerInstantly(player);
      return;
  }
}

async function showSkipDaysMenu(player) {
  const form = new ModalFormData()
    .title("Skip Days")
    .slider("Days to skip", 1, 365, { step: 1, defaultValue: 1 });

  const result = await form.show(player);
  if (result.canceled || !result.formValues) {
    logger.trace("developerMenu", "Skip days canceled", { playerId: player.id });
    return;
  }

  const days = Math.max(1, Math.floor(Number(result.formValues[0]) || 1));
  const ticks = days * 24000;

  try {
    const overworld = world.getDimension("minecraft:overworld");
    await overworld.runCommandAsync(`time add ${ticks}`);
    player.sendMessage(`Developer: skipped ${days} in-game day(s).`);
    logger.info("developerMenu", "Developer skipped days", { playerId: player.id, days, ticks });
  } catch (error) {
    player.sendMessage("Developer: failed to skip days.");
    logger.error("developerMenu", "Skip days failed", { playerId: player.id, days, ticks, error: String(error) });
  }
}

async function setRespawnHere(player) {
  const x = Math.floor(player.location.x);
  const y = Math.floor(player.location.y);
  const z = Math.floor(player.location.z);

  try {
    await player.runCommandAsync(`spawnpoint @s ${x} ${y} ${z}`);
    player.sendMessage(`Developer: respawn point set to ${x}, ${y}, ${z}.`);
    logger.info("developerMenu", "Developer set respawn point", { playerId: player.id, dimension: player.dimension.id, x, y, z });
  } catch (error) {
    player.sendMessage("Developer: failed to set respawn point.");
    logger.error("developerMenu", "Set respawn point failed", { playerId: player.id, x, y, z, error: String(error) });
  }
}

async function killPlayerInstantly(player) {
  try {
    await player.runCommandAsync("kill @s");
    logger.warn("developerMenu", "Developer used instant kill", { playerId: player.id, dimension: player.dimension.id });
  } catch (error) {
    player.sendMessage("Developer: failed to kill player.");
    logger.error("developerMenu", "Instant kill failed", { playerId: player.id, error: String(error) });
  }
}
