"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickTravelTracking = tickTravelTracking;
const server_1 = require("@minecraft/server");
const questService_js_1 = require("./questService.js");
const lastPositions = new Map();
function tickTravelTracking() {
    for (const player of server_1.world.getPlayers()) {
        const previous = lastPositions.get(player.id);
        const current = player.location;
        if (previous && previous.dimensionId === player.dimension.id) {
            const dx = current.x - previous.x;
            const dy = current.y - previous.y;
            const dz = current.z - previous.z;
            const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
            // Teleport/lag spike guard: ignore and reset baseline for extreme jumps
            if (horizontalDistance > 80 || Math.abs(dy) > 60) {
                lastPositions.set(player.id, { x: current.x, y: current.y, z: current.z, dimensionId: player.dimension.id, wasRidingBoat: false, wasGliding: player.isGliding });
                continue;
            }
            if (horizontalDistance > 0.01 && horizontalDistance < 20) {
                (0, questService_js_1.addQuestProgress)(player, "travel", "horizontal_distance", horizontalDistance);
            }
            if (player.isSwimming && horizontalDistance > 0.01 && horizontalDistance < 20) {
                (0, questService_js_1.addQuestProgress)(player, "travel", "swim_distance", horizontalDistance);
            }
            const isGlidingNow = player.isGliding === true;
            const wasGliding = previous.wasGliding === true;
            if (isGlidingNow && horizontalDistance > 0.01 && horizontalDistance < 60 && (wasGliding || horizontalDistance < 20)) {
                (0, questService_js_1.addQuestProgress)(player, "travel", "glide_distance", horizontalDistance);
            }
            const riding = player.getComponent("minecraft:riding")?.entityRidingOn;
            const isBoatNow = riding?.typeId === "minecraft:boat";
            const wasBoat = previous.wasRidingBoat === true;
            if (isBoatNow && horizontalDistance > 0.01 && horizontalDistance < 30 && (wasBoat || horizontalDistance < 8)) {
                (0, questService_js_1.addQuestProgress)(player, "travel", "boat_distance", horizontalDistance);
            }
            if (dy > 0.42 && dy < 3) {
                (0, questService_js_1.addQuestProgress)(player, "travel", "jump_count", 1);
            }
            if (dy < -2 && Math.abs(dy) < 40) {
                (0, questService_js_1.addQuestProgress)(player, "travel", "fall_distance", Math.abs(dy));
            }
        }
        const ridingNow = player.getComponent("minecraft:riding")?.entityRidingOn;
        lastPositions.set(player.id, { x: current.x, y: current.y, z: current.z, dimensionId: player.dimension.id, wasRidingBoat: ridingNow?.typeId === "minecraft:boat", wasGliding: player.isGliding === true });
    }
}
