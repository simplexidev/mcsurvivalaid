"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showSettingsMenu = showSettingsMenu;
const server_ui_1 = require("@minecraft/server-ui");
const playerState_js_1 = require("../state/playerState.js");
const firstSpawnForms_js_1 = require("./firstSpawnForms.js");
const logger_js_1 = require("../logging/logger.js");
const developerMenu_js_1 = require("./developerMenu.js");
const safeShow_js_1 = require("./safeShow.js");
const LOG_LEVELS = ["trace", "info", "warn", "error"];
async function showSettingsMenu(player) {
    const root = new server_ui_1.ActionFormData().title("Survival Aid Settings").button("Gameplay Settings").button("Recover Starter Items").button(`Content Log Level: ${logger_js_1.logger.getLogLevel()}`)
        .button("Developer Tools");
    const rootResult = await (0, safeShow_js_1.safeShow)(root, player, "settingsMenu", "root");
    if (rootResult.canceled || rootResult.selection === undefined) {
        logger_js_1.logger.trace("settingsMenu", "Settings root canceled", { playerId: player.id });
        return;
    }
    if (rootResult.selection === 1) {
        (0, firstSpawnForms_js_1.giveStarterItems)(player);
        player.sendMessage("Starter items re-issued (if inventory has space).");
        logger_js_1.logger.info("settingsMenu", "Starter items re-issued from settings menu", { playerId: player.id });
        return;
    }
    if (rootResult.selection === 2) {
        await showLoggingLevelMenu(player);
        return;
    }
    if (rootResult.selection === 3) {
        await (0, developerMenu_js_1.showDeveloperMenu)(player);
        return;
    }
    const state = (0, playerState_js_1.getPlayerState)(player);
    const form = new server_ui_1.ModalFormData().title("Survival Aid Settings")
        .toggle("Show HUD", { defaultValue: state.settings.showHud })
        .toggle("Show Days Survived", { defaultValue: state.settings.showDaysSurvived })
        .toggle("Show Days Until Reward", { defaultValue: state.settings.showDaysUntilReward })
        .toggle("Show Reward Availability", { defaultValue: state.settings.showRewardReady })
        .toggle("Chest Changes Texture", { defaultValue: state.settings.chestChangesTexture })
        .toggle("Allow Teleport to Respawn", { defaultValue: state.settings.allowTeleportToRespawn })
        .toggle("Allow Teleport to Last Death", { defaultValue: state.settings.allowTeleportToDeath })
        .slider("Teleport Cooldown (sec)", 10, 600, { defaultValue: state.settings.teleportCooldownSeconds });
    const result = await (0, safeShow_js_1.safeShow)(form, player, "settingsMenu", "gameplay_settings");
    if (result.canceled || !result.formValues) {
        logger_js_1.logger.trace("settingsMenu", "Gameplay settings canceled", { playerId: player.id });
        return;
    }
    const [showHud, showDaysSurvived, showDaysUntilReward, showRewardReady, chestChangesTexture, allowTeleportToRespawn, allowTeleportToDeath, teleportCooldownSeconds] = result.formValues;
    Object.assign(state.settings, { showHud, showDaysSurvived, showDaysUntilReward, showRewardReady, chestChangesTexture, allowTeleportToRespawn, allowTeleportToDeath, teleportCooldownSeconds: Math.floor(teleportCooldownSeconds) });
    (0, playerState_js_1.setPlayerState)(player, state);
    logger_js_1.logger.info("settingsMenu", "Player settings updated", { playerId: player.id, settings: state.settings });
    player.sendMessage("Survival Aid settings updated.");
}
async function showLoggingLevelMenu(player) {
    const current = logger_js_1.logger.getLogLevel();
    const form = new server_ui_1.ActionFormData().title("Content Log Level").body("Choose how verbose the Survival Aid content log should be.");
    for (const level of LOG_LEVELS)
        form.button(level === current ? `${level} (current)` : level);
    const result = await (0, safeShow_js_1.safeShow)(form, player, "settingsMenu", "logging_level");
    if (result.canceled || result.selection === undefined)
        return;
    const selected = LOG_LEVELS[result.selection];
    if (!selected || !logger_js_1.logger.setLogLevel(selected))
        return;
    logger_js_1.logger.info("settingsMenu", "Log level updated", { playerId: player.id, selected });
    player.sendMessage(`Survival Aid content log level set to ${selected}.`);
}
