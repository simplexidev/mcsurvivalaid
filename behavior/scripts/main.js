import { world, system } from "@minecraft/server";

import { ADDON } from "./constants.js";
import { registerSurvivalChestComponent, syncChestVisualForPlayer } from "./blocks/survivalAidChest.js";
import { registerBookOfSurvivalComponent } from "./items/bookOfSurvival.js";
import { handleInitialSpawn } from "./ui/firstSpawnForms.js";
import { updateHudForAllPlayers } from "./ui/bookOfSurvivalMenu.js";
import { handlePlayerDeath } from "./teleport/teleportService.js";
import { registerBlockQuestTracking } from "./quests/blockTracker.js";
import { registerCombatQuestTracking } from "./quests/combatTracker.js";
import { tickTravelTracking } from "./quests/travelTracker.js";
import { tickRewardService } from "./rewards/rewardService.js";
import { ensureWorldStateInitialized } from "./state/worldState.js";

system.beforeEvents.startup.subscribe((event) => {
  registerSurvivalChestComponent(event);
  registerBookOfSurvivalComponent(event);
});

world.afterEvents.playerSpawn.subscribe((event) => {
  const delay = event.initialSpawn ? 40 : 5;
  if (event.initialSpawn) {
    system.runTimeout(() => {
      ensureWorldStateInitialized();
      handleInitialSpawn(event.player);
    }, delay);
  }
});

world.afterEvents.entityDie.subscribe((event) => {
  handlePlayerDeath(event);
});

registerBlockQuestTracking();
registerCombatQuestTracking();

system.runInterval(() => {
  tickRewardService();
  tickTravelTracking();
  updateHudForAllPlayers();
  for (const p of world.getPlayers()) syncChestVisualForPlayer(p);
}, 20);

runCompatibilityProbe();
console.warn(`${ADDON.name} loaded.`);

function runCompatibilityProbe() {
  const checks = [
    ["afterEvents.playerSpawn", typeof world.afterEvents?.playerSpawn?.subscribe === "function"],
    ["beforeEvents.startup", typeof system.beforeEvents?.startup?.subscribe === "function"],
    ["player.onScreenDisplay.setActionBar", typeof world.getAllPlayers !== "undefined"],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length > 0) {
    console.warn(`Survival Aid compatibility probe failed: ${failed.join(", ")}`);
  } else {
    console.warn("Survival Aid compatibility probe passed for required API surfaces.");
  }
}
