"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSurvivalChestComponent = registerSurvivalChestComponent;
exports.handleSurvivalChestInteract = handleSurvivalChestInteract;
exports.syncChestVisualForPlayer = syncChestVisualForPlayer;
const server_1 = require("@minecraft/server");
const constants_js_1 = require("../constants.js");
const playerState_js_1 = require("../state/playerState.js");
const rewardService_js_1 = require("../rewards/rewardService.js");
function registerSurvivalChestComponent(event) {
    event.blockComponentRegistry.registerCustomComponent(constants_js_1.ADDON.components.survivalChest, {
        onPlace(args) {
            const player = args.player;
            if (!player)
                return;
            const state = (0, playerState_js_1.getPlayerState)(player);
            if (state.chest.placed && state.chest.location) {
                player.sendMessage("You can only have one Survival Chest.");
                try {
                    args.block.setType("minecraft:air");
                }
                catch { }
                const inv = player.getComponent("minecraft:inventory")?.container;
                if (inv)
                    inv.addItem(new server_1.ItemStack(constants_js_1.ADDON.blocks.survivalChest, 1));
                return;
            }
            state.chest.placed = true;
            state.chest.location = {
                ownerId: player.id,
                ownerToken: `${player.id}:${server_1.system.currentTick}`,
                dimension: args.block.dimension.id,
                x: args.block.location.x,
                y: args.block.location.y,
                z: args.block.location.z
            };
            (0, playerState_js_1.setPlayerState)(player, state);
            syncChestVisualForPlayer(player);
        },
        onPlayerInteract(args) {
            const player = args.player;
            if (!player)
                return;
            handleSurvivalChestInteract(player, args.block);
        },
        onPlayerDestroy(args) {
            const player = args.player;
            if (!player)
                return;
            const state = (0, playerState_js_1.getPlayerState)(player);
            if (!state.chest.location)
                return;
            const b = args.block.location;
            const own = state.chest.location;
            if (own.dimension === args.block.dimension.id && own.x === b.x && own.y === b.y && own.z === b.z) {
                clearChestRegistration(state);
                (0, playerState_js_1.setPlayerState)(player, state);
            }
        }
    });
}
function handleSurvivalChestInteract(player, block) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    const own = state.chest.location;
    const b = block.location;
    const isOwnChest = !!own && own.dimension === block.dimension.id && own.x === b.x && own.y === b.y && own.z === b.z;
    (0, rewardService_js_1.claimPendingRewards)(player, { includeClassAndQuestRewards: isOwnChest });
}
function syncChestVisualForPlayer(player) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    if (!state.chest.location || !state.settings.chestChangesTexture)
        return;
    try {
        const dim = server_1.world.getDimension(state.chest.location.dimension);
        const block = dim.getBlock({ x: state.chest.location.x, y: state.chest.location.y, z: state.chest.location.z });
        if (!block || block.typeId !== constants_js_1.ADDON.blocks.survivalChest) {
            clearChestRegistration(state);
            (0, playerState_js_1.setPlayerState)(player, state);
            player.sendMessage("Your registered Survival Chest was missing or replaced; registration cleared.");
            return;
        }
    }
    catch {
        player.sendMessage("Could not access your registered Survival Chest dimension; registration preserved.");
    }
}
function clearChestRegistration(state) {
    state.chest.placed = false;
    state.chest.location = null;
}
