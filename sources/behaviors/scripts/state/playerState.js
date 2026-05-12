"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultPlayerState = createDefaultPlayerState;
exports.getPlayerState = getPlayerState;
exports.setPlayerState = setPlayerState;
exports.updatePlayerState = updatePlayerState;
const server_1 = require("@minecraft/server");
const storageKeys_js_1 = require("./storageKeys.js");
const logger_js_1 = require("../logging/logger.js");
function createDefaultPlayerState() {
    return {
        stateVersion: 1,
        hasSeenInitialPrompt: false,
        enabled: false,
        classTrack: {
            currentClass: null,
            completedClasses: [],
            classTrackStartDay: 0,
            lastDeathDay: 0,
            claimedClassRewardDays: [],
            pendingClassRewardDays: [],
            partialClassRewards: {},
            nextClassChangePromptDay: 20,
            tier5ClaimedCurrent: false
        },
        deaths: { lastDeathLocation: null, respawnLocation: null },
        chest: { placed: false, location: null },
        requests: { active: [] },
        quests: { travel: {}, blocksBroken: {}, blocksPlaced: {}, combat: {}, claimedQuestRewards: [], pendingQuestRewards: [] },
        cooldowns: { respawnTeleportReadyTick: 0, deathTeleportReadyTick: 0 },
        settings: {
            showHud: true, showDaysSurvived: true, showDaysUntilReward: true, showRewardReady: true,
            chestChangesTexture: true, allowTeleportToDeath: true, allowTeleportToRespawn: true,
            teleportCooldownSeconds: 60
        }
    };
}
function getPlayerState(player) {
    const raw = server_1.world.getDynamicProperty((0, storageKeys_js_1.getPlayerStateKey)(player));
    if (typeof raw !== "string" || raw.length === 0) {
        logger_js_1.logger.trace("playerState", "No saved state, using defaults", { playerId: player.id });
        return createDefaultPlayerState();
    }
    try {
        const parsed = JSON.parse(raw);
        const d = createDefaultPlayerState();
        return { ...d, ...parsed, classTrack: { ...d.classTrack, ...(parsed.classTrack ?? {}) }, deaths: { ...d.deaths, ...(parsed.deaths ?? {}) }, chest: { ...d.chest, ...(parsed.chest ?? {}) }, requests: { ...d.requests, ...(parsed.requests ?? {}) }, quests: { ...d.quests, ...(parsed.quests ?? {}) }, cooldowns: { ...d.cooldowns, ...(parsed.cooldowns ?? {}) }, settings: { ...d.settings, ...(parsed.settings ?? {}) } };
    }
    catch (error) {
        logger_js_1.logger.warn("playerState", "Failed to parse player state; using defaults", { playerId: player.id, error: String(error) });
        return createDefaultPlayerState();
    }
}
function setPlayerState(player, state) { server_1.world.setDynamicProperty((0, storageKeys_js_1.getPlayerStateKey)(player), JSON.stringify(state)); logger_js_1.logger.trace("playerState", "Player state saved", { playerId: player.id }); }
function updatePlayerState(player, updater) { const state = getPlayerState(player); const updated = updater(state) ?? state; setPlayerState(player, updated); return updated; }
