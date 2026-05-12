"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showItemRequestsMenu = showItemRequestsMenu;
exports.queueItemRequest = queueItemRequest;
exports.collectReadyItemRequests = collectReadyItemRequests;
const server_ui_1 = require("@minecraft/server-ui");
const server_1 = require("@minecraft/server");
const playerState_js_1 = require("../state/playerState.js");
const logger_js_1 = require("../logging/logger.js");
const safeShow_js_1 = require("../ui/safeShow.js");
const REQUESTABLE_ITEMS = ["coal", "raw_iron", "raw_copper", "raw_gold", "redstone", "lapis_lazuli", "oak_log", "spruce_log", "birch_log", "cobblestone", "sand", "gravel", "clay_ball", "wheat_seeds", "sugar_cane"];
async function showItemRequestsMenu(player) {
    const root = new server_ui_1.ActionFormData().title("Item Requests").button("Create Request").button("View Active Requests").button("Cancel Request");
    const rootResult = await (0, safeShow_js_1.safeShow)(root, player, "requestService", "root");
    if (rootResult.canceled || rootResult.selection === undefined) {
        logger_js_1.logger.trace("requestService", "Request root menu canceled", { playerId: player.id });
        return;
    }
    if (rootResult.selection === 1)
        return showActiveRequests(player);
    if (rootResult.selection === 2)
        return showCancelRequestMenu(player);
    const form = new server_ui_1.ActionFormData().title("Item Requests").body("Select an item to request.");
    for (const item of REQUESTABLE_ITEMS)
        form.button(item);
    const result = await (0, safeShow_js_1.safeShow)(form, player, "requestService", "item_select");
    if (result.canceled || result.selection === undefined) {
        logger_js_1.logger.trace("requestService", "Request item selection canceled", { playerId: player.id });
        return;
    }
    const itemId = `minecraft:${REQUESTABLE_ITEMS[result.selection]}`;
    const qtyForm = new server_ui_1.ModalFormData().title("Request Quantity").slider("Quantity", 1, 64, { defaultValue: 1 });
    const qtyResult = await (0, safeShow_js_1.safeShow)(qtyForm, player, "requestService", "quantity");
    if (qtyResult.canceled || !qtyResult.formValues) {
        logger_js_1.logger.trace("requestService", "Request quantity canceled", { playerId: player.id });
        return;
    }
    queueItemRequest(player, itemId, Math.floor(qtyResult.formValues[0]));
}
function showActiveRequests(player) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    const active = state.requests.active.filter(r => !r.claimed);
    if (active.length === 0) {
        logger_js_1.logger.trace("requestService", "No active requests to display", { playerId: player.id });
        return player.sendMessage("No active item requests.");
    }
    const lines = active.map((r, i) => `${i + 1}. ${r.itemId} x${r.quantity} (${Math.max(0, Math.ceil((r.readyAtTick - server_1.system.currentTick) / 20))}s)`);
    player.sendMessage(`Active Requests: ${lines.join(" | ")}`);
}
async function showCancelRequestMenu(player) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    const active = state.requests.active.filter(r => !r.claimed);
    if (active.length === 0) {
        logger_js_1.logger.trace("requestService", "No active requests to cancel", { playerId: player.id });
        return player.sendMessage("No active requests to cancel.");
    }
    const form = new server_ui_1.ActionFormData().title("Cancel Item Request").body("Select a request to cancel.");
    for (const req of active) {
        const sec = Math.max(0, Math.ceil((req.readyAtTick - server_1.system.currentTick) / 20));
        form.button(`${req.itemId} x${req.quantity}\n${sec}s remaining`);
    }
    const result = await (0, safeShow_js_1.safeShow)(form, player, "requestService", "cancel_select");
    if (result.canceled || result.selection === undefined) {
        logger_js_1.logger.trace("requestService", "Request item selection canceled", { playerId: player.id });
        return;
    }
    const selected = active[result.selection];
    state.requests.active = state.requests.active.filter(r => r !== selected);
    (0, playerState_js_1.setPlayerState)(player, state);
    logger_js_1.logger.info("requestService", "Request canceled", { playerId: player.id, itemId: selected.itemId, quantity: selected.quantity });
    player.sendMessage(`Canceled request ${selected.itemId} x${selected.quantity}.`);
}
function queueItemRequest(player, itemId, quantity) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    const activeCount = state.requests.active.filter(r => !r.claimed).length;
    if (activeCount >= 5) {
        player.sendMessage("You already have too many active requests (max 5).");
        logger_js_1.logger.warn("requestService", "Request limit reached", { playerId: player.id, activeCount });
        return;
    }
    const duration = Math.ceil(quantity * 1.25) * 20;
    state.requests.active.push({ itemId, quantity, requestedAtTick: server_1.system.currentTick, readyAtTick: server_1.system.currentTick + duration, claimed: false });
    (0, playerState_js_1.setPlayerState)(player, state);
    logger_js_1.logger.info("requestService", "Request queued", { playerId: player.id, itemId, quantity, durationTicks: duration });
    player.sendMessage(`Requested ${quantity}x ${itemId}. Ready in ${Math.ceil(duration / 20)}s.`);
}
function collectReadyItemRequests(state) {
    const ready = [];
    for (const req of state.requests.active) {
        if (!req.claimed && req.readyAtTick <= server_1.system.currentTick) {
            ready.push(req);
            logger_js_1.logger.trace("requestService", "Request ready for claim", { itemId: req.itemId, quantity: req.quantity, readyAtTick: req.readyAtTick });
            req.claimed = true;
        }
    }
    state.requests.active = state.requests.active.filter(r => !r.claimed || (server_1.system.currentTick - r.readyAtTick) < 24000);
    return ready;
}
