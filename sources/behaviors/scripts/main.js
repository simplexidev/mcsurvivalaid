"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@minecraft/server");
const constants_js_1 = require("./constants.js");
const survivalAidChest_js_1 = require("./blocks/survivalAidChest.js");
const bookOfSurvival_js_1 = require("./items/bookOfSurvival.js");
const firstSpawnForms_js_1 = require("./ui/firstSpawnForms.js");
const bookOfSurvivalMenu_js_1 = require("./ui/bookOfSurvivalMenu.js");
const teleportService_js_1 = require("./teleport/teleportService.js");
const blockTracker_js_1 = require("./quests/blockTracker.js");
const combatTracker_js_1 = require("./quests/combatTracker.js");
const travelTracker_js_1 = require("./quests/travelTracker.js");
const rewardService_js_1 = require("./rewards/rewardService.js");
const worldState_js_1 = require("./state/worldState.js");
const logger_js_1 = require("./logging/logger.js");
server_1.system.beforeEvents.startup.subscribe((event) => {
    logger_js_1.logger.info("main", "Startup event received; registering components", { tick: server_1.system.currentTick });
    (0, survivalAidChest_js_1.registerSurvivalChestComponent)(event);
    (0, bookOfSurvival_js_1.registerBookOfSurvivalComponent)(event);
});
server_1.world.afterEvents.playerSpawn.subscribe((event) => {
    const delay = event.initialSpawn ? 40 : 5;
    logger_js_1.logger.trace("main", "playerSpawn event", { playerId: event.player?.id, initialSpawn: event.initialSpawn, delay });
    if (event.initialSpawn) {
        server_1.system.runTimeout(() => {
            (0, worldState_js_1.ensureWorldStateInitialized)();
            (0, firstSpawnForms_js_1.handleInitialSpawn)(event.player);
        }, delay);
    }
});
server_1.world.afterEvents.entityDie.subscribe((event) => {
    logger_js_1.logger.trace("main", "entityDie event", { deadType: event.deadEntity?.typeId, tick: server_1.system.currentTick });
    (0, teleportService_js_1.handlePlayerDeath)(event);
});
server_1.world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (event.block?.typeId !== constants_js_1.ADDON.blocks.survivalChest)
        return;
    if (!event.player)
        return;
    (0, survivalAidChest_js_1.handleSurvivalChestInteract)(event.player, event.block);
});
(0, blockTracker_js_1.registerBlockQuestTracking)();
(0, combatTracker_js_1.registerCombatQuestTracking)();
server_1.system.runInterval(() => {
    logger_js_1.logger.trace("main", "Tick interval start", { tick: server_1.system.currentTick, playerCount: server_1.world.getPlayers().length });
    (0, rewardService_js_1.tickRewardService)();
    (0, travelTracker_js_1.tickTravelTracking)();
    (0, bookOfSurvivalMenu_js_1.updateHudForAllPlayers)();
    for (const p of server_1.world.getPlayers())
        (0, survivalAidChest_js_1.syncChestVisualForPlayer)(p);
}, 20);
runCompatibilityProbe();
logger_js_1.logger.info("main", `${constants_js_1.ADDON.name} loaded.`, { logLevel: logger_js_1.logger.getLogLevel() });
function runCompatibilityProbe() {
    const samplePlayer = server_1.world.getPlayers()[0];
    const checks = [
        ["afterEvents.playerSpawn", typeof server_1.world.afterEvents?.playerSpawn?.subscribe === "function"],
        ["beforeEvents.startup", typeof server_1.system.beforeEvents?.startup?.subscribe === "function"],
        ["world.getPlayers", typeof server_1.world.getPlayers === "function"],
        ["player.onScreenDisplay.setActionBar", typeof samplePlayer?.onScreenDisplay?.setActionBar === "function" || server_1.world.getPlayers().length === 0],
    ];
    const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
    if (failed.length > 0) {
        logger_js_1.logger.warn("main", "Compatibility probe failed", { failed });
    }
    else {
        logger_js_1.logger.info("main", "Compatibility probe passed for required API surfaces.", {});
    }
}
