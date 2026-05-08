import { world, system } from "@minecraft/server";

import { ADDON } from "./constants.js";
import { handleSurvivalChestInteract, registerSurvivalChestComponent, syncChestVisualForPlayer } from "./blocks/survivalAidChest.js";
import { registerBookOfSurvivalComponent } from "./items/bookOfSurvival.js";
import { handleInitialSpawn } from "./ui/firstSpawnForms.js";
import { updateHudForAllPlayers } from "./ui/bookOfSurvivalMenu.js";
import { handlePlayerDeath } from "./teleport/teleportService.js";
import { registerBlockQuestTracking } from "./quests/blockTracker.js";
import { registerCombatQuestTracking } from "./quests/combatTracker.js";
import { tickTravelTracking } from "./quests/travelTracker.js";
import { tickRewardService } from "./rewards/rewardService.js";
import { ensureWorldStateInitialized } from "./state/worldState.js";
import { logger } from "./logging/logger.js";

system.beforeEvents.startup.subscribe((event) => {
  logger.info("main", "Startup event received; registering components", { tick: system.currentTick });
  registerSurvivalChestComponent(event);
  registerBookOfSurvivalComponent(event);
});

world.afterEvents.playerSpawn.subscribe((event) => {
  const delay = event.initialSpawn ? 40 : 5;
  logger.trace("main", "playerSpawn event", { playerId: event.player?.id, initialSpawn: event.initialSpawn, delay });
  if (event.initialSpawn) {
    system.runTimeout(() => {
      ensureWorldStateInitialized();
      handleInitialSpawn(event.player);
    }, delay);
  }
});

world.afterEvents.entityDie.subscribe((event) => {
  logger.trace("main", "entityDie event", { deadType: event.deadEntity?.typeId, tick: system.currentTick });
  handlePlayerDeath(event);
});

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  if (event.block?.typeId !== ADDON.blocks.survivalChest) return;
  if (!event.player) return;
  handleSurvivalChestInteract(event.player, event.block);
});

registerBlockQuestTracking();
registerCombatQuestTracking();

system.runInterval(() => {
  logger.trace("main", "Tick interval start", { tick: system.currentTick, playerCount: world.getPlayers().length });
  tickRewardService();
  tickTravelTracking();
  updateHudForAllPlayers();
  for (const p of world.getPlayers()) syncChestVisualForPlayer(p);
}, 20);

runCompatibilityProbe();
logger.info("main", `${ADDON.name} loaded.`, { logLevel: logger.getLogLevel() });

function runCompatibilityProbe() {
  const checks = [
    ["afterEvents.playerSpawn", typeof world.afterEvents?.playerSpawn?.subscribe === "function"],
    ["beforeEvents.startup", typeof system.beforeEvents?.startup?.subscribe === "function"],
    ["player.onScreenDisplay.setActionBar", typeof world.getAllPlayers !== "undefined"],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length > 0) {
    logger.warn("main", "Compatibility probe failed", { failed });
  } else {
    logger.info("main", "Compatibility probe passed for required API surfaces.");
  }
}
