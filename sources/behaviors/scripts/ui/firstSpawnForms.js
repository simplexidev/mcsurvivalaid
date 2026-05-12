"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInitialSpawn = handleInitialSpawn;
exports.giveStarterItems = giveStarterItems;
const server_ui_1 = require("@minecraft/server-ui");
const server_1 = require("@minecraft/server");
const constants_js_1 = require("../constants.js");
const playerState_js_1 = require("../state/playerState.js");
const classDefinitions_js_1 = require("../classes/classDefinitions.js");
const classService_js_1 = require("../classes/classService.js");
const logger_js_1 = require("../logging/logger.js");
const safeShow_js_1 = require("./safeShow.js");
const activeInitialPrompts = new Set();
async function handleInitialSpawn(player) {
    logger_js_1.logger.trace("firstSpawn", "handleInitialSpawn invoked", { playerId: player.id });
    if (activeInitialPrompts.has(player.id)) {
        logger_js_1.logger.trace("firstSpawn", "Prompt already active", { playerId: player.id });
        return;
    }
    const state = (0, playerState_js_1.getPlayerState)(player);
    if (state.hasSeenInitialPrompt) {
        logger_js_1.logger.trace("firstSpawn", "Initial prompt already seen", { playerId: player.id });
        return;
    }
    activeInitialPrompts.add(player.id);
    const enableForm = new server_ui_1.MessageFormData().title("Survival Aid Add-On").body("This world allows for world-based quests, daily rewards, and other helpful survival utilities. Would you like to enable these features?").button1("Enable").button2("Disable");
    const enableResult = await showRequiredMessageForm(player, enableForm, "initial_enable");
    if (enableResult.selection !== 0) {
        state.hasSeenInitialPrompt = true;
        state.enabled = false;
        (0, playerState_js_1.setPlayerState)(player, state);
        player.sendMessage("Survival Aid disabled for your player profile.");
        logger_js_1.logger.info("firstSpawn", "Player disabled Survival Aid at prompt", { playerId: player.id });
        activeInitialPrompts.delete(player.id);
        return;
    }
    await showClassSelection(player);
    activeInitialPrompts.delete(player.id);
}
async function showClassSelection(player) {
    const classes = (0, classDefinitions_js_1.getClassList)();
    logger_js_1.logger.trace("firstSpawn", "Showing class selection", { playerId: player.id, classCount: classes.length });
    while (true) {
        const form = new server_ui_1.ActionFormData().title("Choose Your Class").body("Pick your first Survival Aid class.");
        for (const c of classes)
            form.button(`${c.name}
${c.description}`);
        const result = await showRequiredActionForm(player, form, "class_selection");
        if (result.selection !== undefined) {
            const selectedClass = classes[result.selection];
            logger_js_1.logger.info("firstSpawn", "Initial class selected", { playerId: player.id, classId: selectedClass.id });
            (0, classService_js_1.setInitialClass)(player, selectedClass.id);
            giveStarterItems(player);
            player.sendMessage(`Survival Aid enabled. Class selected: ${selectedClass.name}.`);
            return;
        }
        logger_js_1.logger.warn("firstSpawn", "Class selection returned invalid result", { playerId: player.id, result });
        const retry = await showRequiredMessageForm(player, new server_ui_1.MessageFormData().title("Class Selection Required").body("You must pick a class to enable Survival Aid now. Continue selecting?").button1("Continue").button2("Disable Survival Aid"), "class_selection_retry");
        if (retry.canceled || retry.selection !== 0) {
            const state = (0, playerState_js_1.getPlayerState)(player);
            state.hasSeenInitialPrompt = true;
            state.enabled = false;
            (0, playerState_js_1.setPlayerState)(player, state);
            player.sendMessage("Survival Aid disabled for your player profile.");
            logger_js_1.logger.info("firstSpawn", "Player exited class prompt and disabled", { playerId: player.id });
            return;
        }
    }
}
async function showRequiredMessageForm(player, form, flow) {
    let attempts = 0;
    while (true) {
        attempts++;
        const result = await (0, safeShow_js_1.safeShow)(form, player, "firstSpawn", `required_message_${flow}`);
        if (!result.canceled && result.selection !== undefined)
            return result;
        if (attempts <= 3 || attempts % 10 === 0) {
            logger_js_1.logger.warn("firstSpawn", "Required message form canceled; re-showing", { playerId: player.id, flow, attempts });
        }
        await waitTicks(10);
    }
}
async function showRequiredActionForm(player, form, flow) {
    let attempts = 0;
    while (true) {
        attempts++;
        const result = await (0, safeShow_js_1.safeShow)(form, player, "firstSpawn", `required_action_${flow}`);
        if (!result.canceled && result.selection !== undefined)
            return result;
        if (attempts <= 3 || attempts % 10 === 0) {
            logger_js_1.logger.warn("firstSpawn", "Required action form canceled; re-showing", { playerId: player.id, flow, attempts });
        }
        await waitTicks(10);
    }
}
function waitTicks(ticks) {
    return new Promise((resolve) => {
        server_1.system.runTimeout(() => resolve(), ticks);
    });
}
function giveStarterItems(player) {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) {
        logger_js_1.logger.warn("firstSpawn", "No inventory container for starter items", { playerId: player.id });
        return;
    }
    ensureOneItem(inventory, constants_js_1.ADDON.blocks.survivalChest);
    ensureOneItem(inventory, constants_js_1.ADDON.items.bookOfSurvival);
}
function ensureOneItem(container, itemId) {
    if (countItem(container, itemId) > 0) {
        logger_js_1.logger.trace("firstSpawn", "Starter item already present", { itemId });
        return;
    }
    try {
        container.addItem(new server_1.ItemStack(itemId, 1));
        logger_js_1.logger.trace("firstSpawn", "Starter item granted", { itemId });
    }
    catch (error) {
        logger_js_1.logger.error("firstSpawn", "Failed to grant starter item", { itemId, error: String(error) });
    }
}
function countItem(container, itemId) {
    let total = 0;
    for (let i = 0; i < container.size; i++) {
        const slot = container.getItem(i);
        if (slot?.typeId === itemId)
            total += slot.amount;
    }
    return total;
}
