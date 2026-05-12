"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showBookOfSurvivalMenu = showBookOfSurvivalMenu;
exports.updateHudForAllPlayers = updateHudForAllPlayers;
const server_1 = require("@minecraft/server");
const server_ui_1 = require("@minecraft/server-ui");
const playerState_js_1 = require("../state/playerState.js");
const rewardService_js_1 = require("../rewards/rewardService.js");
const rewardSchedule_js_1 = require("../rewards/rewardSchedule.js");
const settingsMenu_js_1 = require("./settingsMenu.js");
const documentationMenu_js_1 = require("./documentationMenu.js");
const teleportService_js_1 = require("../teleport/teleportService.js");
const structureLocator_js_1 = require("../structures/structureLocator.js");
const requestService_js_1 = require("../items/requestService.js");
const safeShow_js_1 = require("./safeShow.js");
const lastHudText = new Map();
async function showBookOfSurvivalMenu(player) {
    const form = new server_ui_1.ActionFormData()
        .title("Book of Survival")
        .body("Choose an option.")
        .button("Structure Locator")
        .button("Item Requests")
        .button("Teleport to Respawn")
        .button("Teleport to Last Death")
        .button("In-Game Documentation")
        .button("Add-On Settings");
    const result = await (0, safeShow_js_1.safeShow)(form, player, "bookOfSurvivalMenu", "root");
    if (result.canceled || result.selection === undefined) {
        return;
    }
    switch (result.selection) {
        case 0:
            await (0, structureLocator_js_1.showStructureLocatorMenu)(player);
            break;
        case 1:
            await (0, requestService_js_1.showItemRequestsMenu)(player);
            break;
        case 2:
            (0, teleportService_js_1.teleportToRespawn)(player);
            break;
        case 3:
            (0, teleportService_js_1.teleportToLastDeath)(player);
            break;
        case 4:
            await (0, documentationMenu_js_1.showDocumentationMenu)(player);
            break;
        case 5:
            await (0, settingsMenu_js_1.showSettingsMenu)(player);
            break;
    }
}
function updateHudForAllPlayers() {
    for (const player of server_1.world.getPlayers()) {
        const state = (0, playerState_js_1.getPlayerState)(player);
        if (!state.enabled || !state.settings.showHud) {
            continue;
        }
        const worldDay = (0, rewardService_js_1.getCurrentWorldDay)();
        const daysSurvived = Math.max(0, worldDay - state.classTrack.lastDeathDay);
        const classTrackDays = Math.max(0, worldDay - state.classTrack.classTrackStartDay);
        const nextRewardDay = (0, rewardSchedule_js_1.getNextClassRewardDay)(classTrackDays, state.classTrack.claimedClassRewardDays, state.classTrack.pendingClassRewardDays);
        const rewardReady = (0, rewardService_js_1.hasPendingRewards)(player);
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
