"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_KEYS = void 0;
exports.getPlayerStateKey = getPlayerStateKey;
exports.STORAGE_KEYS = {
    playerStatePrefix: "survival_aid:survival_aid:player:",
    worldState: "survival_aid:survival_aid:world"
};
function getPlayerStateKey(player) {
    return `${exports.STORAGE_KEYS.playerStatePrefix}${player.id}`;
}
