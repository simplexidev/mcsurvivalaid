import { world, system } from "@minecraft/server";

import { ADDON } from "./constants.js";
import { registerSurvivalChestComponent } from "./blocks/survivalChest.js";
import { registerBookOfSurvivalComponent } from "./items/bookOfSurvival.js";
import { handleInitialSpawn } from "./ui/firstSpawnForms.js";
import { updateHudForAllPlayers } from "./ui/bookOfSurvivalMenu.js";
import { handlePlayerDeath } from "./teleport/teleportService.js";
import { registerBlockQuestTracking } from "./quests/blockTracker.js";
import { registerCombatQuestTracking } from "./quests/combatTracker.js";
import { tickTravelTracking } from "./quests/travelTracker.js";
import { tickRewardService } from "./rewards/rewardService.js";
import { ensureWorldStateInitialized } from "./state/worldState.js";

world.beforeEvents.worldInitialize.subscribe((event) => {
  ensureWorldStateInitialized();
  registerSurvivalChestComponent(event);
  registerBookOfSurvivalComponent(event);
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (event.initialSpawn) {
    system.run(() => handleInitialSpawn(event.player));
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
}, 20);

console.warn(`${ADDON.name} loaded.`);