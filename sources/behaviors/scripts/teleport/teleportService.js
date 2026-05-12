"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTeleportLocation = registerTeleportLocation;
exports.removeTeleportLocation = removeTeleportLocation;
exports.teleportPlayer = teleportPlayer;
exports.handlePlayerDeath = handlePlayerDeath;
exports.teleportToRespawn = teleportToRespawn;
exports.teleportToLastDeath = teleportToLastDeath;
const server_1 = require("@minecraft/server");
const playerState_js_1 = require("../state/playerState.js");
const logger_js_1 = require("../logging/logger.js");
const rewardService_js_1 = require("../rewards/rewardService.js");
//TODO: Implement and incorporate these. Locations should be named, and will be available to be added by the player via the book. initial spawn, respawn point and death locations will have the names "Initial Spawn", "Respawn", and "Last Death" respectively.
function registerTeleportLocation(player, name, dimension, x, y, z) {
    // TODO: named teleport registry is intentionally not implemented yet.
    return false;
}
function removeTeleportLocation(player, name) {
    // TODO: named teleport registry is intentionally not implemented yet.
    return false;
}
function teleportPlayer(player, name) {
    // TODO: named teleport registry is intentionally not implemented yet.
    return false;
}
function handlePlayerDeath(event) {
    const dead = event.deadEntity;
    if (!dead || dead.typeId !== "minecraft:player")
        return;
    logger_js_1.logger.info("teleportService", "Player death captured", { playerId: dead.id, dimension: dead.dimension.id });
    const state = (0, playerState_js_1.getPlayerState)(dead);
    const location = dead.location;
    state.deaths.lastDeathLocation = { dimension: dead.dimension.id, x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z), tick: server_1.system.currentTick, day: (0, rewardService_js_1.getCurrentWorldDay)() };
    const worldDay = (0, rewardService_js_1.getCurrentWorldDay)();
    state.classTrack.lastDeathDay = worldDay;
    state.classTrack.classTrackStartDay = worldDay;
    state.classTrack.tier5ClaimedCurrent = false;
    (0, playerState_js_1.setPlayerState)(dead, state);
}
function canUseCooldown(player, key) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    if (server_1.system.currentTick < state.cooldowns[key]) {
        const remain = Math.ceil((state.cooldowns[key] - server_1.system.currentTick) / 20);
        player.sendMessage(`Teleport cooldown: ${remain}s remaining.`);
        logger_js_1.logger.trace("teleportService", "Teleport cooldown active", { playerId: player.id, key, remainingTicks: state.cooldowns[key] - server_1.system.currentTick });
        return false;
    }
    state.cooldowns[key] = server_1.system.currentTick + (state.settings.teleportCooldownSeconds * 20);
    (0, playerState_js_1.setPlayerState)(player, state);
    return true;
}
function teleportToRespawn(player) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    if (!state.settings.allowTeleportToRespawn)
        return player.sendMessage("Teleport to Respawn is disabled.");
    if (!canUseCooldown(player, "respawnTeleportReadyTick"))
        return;
    try {
        const spawn = player.getSpawnPoint?.() ?? null;
        const savedRespawn = state.deaths.respawnLocation ?? null;
        const target = spawn ?? savedRespawn ?? { dimension: player.dimension.id, ...server_1.world.getDefaultSpawnLocation() };
        const dimension = target.dimension ? server_1.world.getDimension(target.dimension) : player.dimension;
        const safe = resolveSafeTarget(dimension, target.x + 0.5, target.y + 1, target.z + 0.5);
        if (!safe)
            return player.sendMessage("No safe respawn-adjacent position found.");
        player.teleport(safe, { dimension });
        applyPostTeleportSafety(player);
        player.sendMessage("Teleported to respawn.");
    }
    catch (e) {
        player.sendMessage("Teleport to respawn failed.");
        logger_js_1.logger.error("teleportService", "teleportToRespawn failed", { playerId: player.id, error: String(e) });
    }
}
function teleportToLastDeath(player) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    if (!state.settings.allowTeleportToDeath)
        return player.sendMessage("Teleport to Last Death is disabled.");
    if (!canUseCooldown(player, "deathTeleportReadyTick"))
        return;
    const lastDeath = state.deaths.lastDeathLocation;
    if (!lastDeath)
        return player.sendMessage("No last death location has been recorded.");
    try {
        const dimension = server_1.world.getDimension(lastDeath.dimension);
        const safe = resolveSafeTarget(dimension, lastDeath.x + 0.5, lastDeath.y + 2, lastDeath.z + 0.5);
        if (!safe)
            return player.sendMessage("No safe last-death-adjacent position found.");
        player.teleport(safe, { dimension });
        applyPostTeleportSafety(player);
        player.sendMessage(`Teleported to last death (${lastDeath.x}, ${lastDeath.y}, ${lastDeath.z}).`);
    }
    catch (e) {
        player.sendMessage("Teleport to last death failed. Dimension/location unavailable.");
        logger_js_1.logger.error("teleportService", "teleportToLastDeath failed", { playerId: player.id, error: String(e) });
    }
}
function resolveSafeTarget(dimension, x, y, z) {
    const offsets = [
        [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2], [0, -2]
    ];
    for (const [ox, oz] of offsets) {
        for (let dy = 0; dy <= 6; dy++) {
            const tx = Math.floor(x + ox), ty = Math.floor(y + dy), tz = Math.floor(z + oz);
            if (isSafeStand(dimension, tx, ty, tz))
                return { x: tx + 0.5, y: ty, z: tz + 0.5 };
        }
    }
    return null;
}
function isSafeStand(dimension, x, y, z) {
    try {
        const feet = dimension.getBlock({ x, y, z });
        const head = dimension.getBlock({ x, y: y + 1, z });
        const floor = dimension.getBlock({ x, y: y - 1, z });
        if (!feet || !head || !floor)
            return false;
        const feetAir = feet.isAir ?? feet.typeId === "minecraft:air";
        const headAir = head.isAir ?? head.typeId === "minecraft:air";
        const floorSolid = !(floor.isAir ?? floor.typeId === "minecraft:air");
        return feetAir && headAir && floorSolid;
    }
    catch {
        return false;
    }
}
function applyPostTeleportSafety(player) {
    try {
        player.runCommandAsync("effect @s resistance 6 1 true");
    }
    catch { }
}
