"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickRewardService = tickRewardService;
exports.hasPendingRewards = hasPendingRewards;
exports.claimPendingRewards = claimPendingRewards;
exports.getCurrentWorldDay = getCurrentWorldDay;
const server_1 = require("@minecraft/server");
const rewardDefinitions_js_1 = require("./rewardDefinitions.js");
const rewardSchedule_js_1 = require("./rewardSchedule.js");
const playerState_js_1 = require("../state/playerState.js");
const requestService_js_1 = require("../items/requestService.js");
const classService_js_1 = require("../classes/classService.js");
const logger_js_1 = require("../logging/logger.js");
function tickRewardService() {
    logger_js_1.logger.trace("rewardService", "Tick reward service", { tick: server_1.system.currentTick, players: server_1.world.getPlayers().length });
    for (const player of server_1.world.getPlayers()) {
        const state = (0, playerState_js_1.getPlayerState)(player);
        const newlyReadyRequests = [];
        for (const req of state.requests.active) {
            if (!req.claimed && req.readyAtTick <= server_1.system.currentTick && !req.notifiedReady) {
                req.notifiedReady = true;
                newlyReadyRequests.push(req);
            }
        }
        if (newlyReadyRequests.length > 0) {
            (0, playerState_js_1.setPlayerState)(player, state);
            const summary = newlyReadyRequests.map(req => `${req.quantity}x ${req.itemId.replace("minecraft:", "")}`).join(", ");
            player.sendMessage(`Item request ready: ${summary}. Open your Survival Chest to claim.`);
            logger_js_1.logger.info("rewardService", "Item requests became ready", { playerId: player.id, count: newlyReadyRequests.length });
        }
        if (!state.enabled || !state.classTrack.currentClass) {
            logger_js_1.logger.trace("rewardService", "Skipping class reward tick for player", { playerId: player.id, enabled: state.enabled, currentClass: state.classTrack.currentClass });
            continue;
        }
        const worldDay = getCurrentWorldDay();
        (0, classService_js_1.maybePromptClassChange)(player, worldDay);
        const classTrackDays = Math.max(0, worldDay - state.classTrack.classTrackStartDay);
        const earnedDays = (0, rewardSchedule_js_1.getEarnedClassRewardDays)(classTrackDays, state.classTrack.claimedClassRewardDays, state.classTrack.pendingClassRewardDays);
        if (earnedDays.length > 0) {
            state.classTrack.pendingClassRewardDays.push(...earnedDays);
            (0, playerState_js_1.setPlayerState)(player, state);
            logger_js_1.logger.info("rewardService", "Queued earned class rewards", { playerId: player.id, earnedDays });
        }
    }
}
function hasPendingRewards(player) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    return state.classTrack.pendingClassRewardDays.length > 0 || state.quests.pendingQuestRewards.length > 0 || state.requests.active.some(r => !r.claimed && r.readyAtTick <= server_1.system.currentTick);
}
function claimPendingRewards(player, options = {}) {
    var _a;
    const { includeClassAndQuestRewards = true } = options;
    const state = (0, playerState_js_1.getPlayerState)(player);
    let grantedAny = false;
    if (includeClassAndQuestRewards && state.enabled && state.classTrack.currentClass) {
        const keepPendingClass = [];
        for (const rewardDay of [...state.classTrack.pendingClassRewardDays]) {
            const key = String(rewardDay);
            const bundle = state.classTrack.partialClassRewards?.[key] ?? getClassRewardsForDay(state.classTrack.currentClass, rewardDay);
            const result = grantRewardBundle(player, bundle);
            if (result.ok) {
                state.classTrack.claimedClassRewardDays.push(rewardDay);
                if (rewardDay >= 20)
                    state.classTrack.tier5ClaimedCurrent = true;
                if (state.classTrack.partialClassRewards)
                    delete state.classTrack.partialClassRewards[key];
                grantedAny = true;
            }
            else {
                keepPendingClass.push(rewardDay);
                (_a = state.classTrack).partialClassRewards ?? (_a.partialClassRewards = {});
                state.classTrack.partialClassRewards[key] = result.remaining;
            }
        }
        state.classTrack.pendingClassRewardDays = keepPendingClass;
    }
    const keepPendingQuests = [];
    if (includeClassAndQuestRewards && state.enabled) {
        for (const quest of [...state.quests.pendingQuestRewards]) {
            const result = grantRewardBundle(player, quest.rewards);
            if (result.ok) {
                state.quests.claimedQuestRewards.push(quest.token);
                grantedAny = true;
            }
            else {
                keepPendingQuests.push({ ...quest, rewards: result.remaining });
            }
        }
    }
    state.quests.pendingQuestRewards = keepPendingQuests;
    const readyRequests = (0, requestService_js_1.collectReadyItemRequests)(state);
    for (const req of readyRequests) {
        const ok = giveOrDrop(player, req.itemId, req.quantity);
        if (!ok) {
            req.claimed = false;
        }
        else {
            grantedAny = true;
        }
    }
    (0, playerState_js_1.setPlayerState)(player, state);
    logger_js_1.logger.info("rewardService", "Processed reward claim", {
        playerId: player.id,
        grantedAny,
        includeClassAndQuestRewards,
        pendingClass: state.classTrack.pendingClassRewardDays.length,
        pendingQuest: state.quests.pendingQuestRewards.length
    });
    player.sendMessage(grantedAny ? "Claimed Survival Aid rewards." : "No Survival Aid rewards are ready.");
}
function getCurrentWorldDay() { return Math.floor(server_1.world.getAbsoluteTime() / 24000); }
function getClassRewardsForDay(classId, rewardDay) { return rewardDefinitions_js_1.CLASS_REWARDS[classId]?.[rewardDay] ?? rewardDefinitions_js_1.CLASSLESS_RECURRING_REWARD; }
function grantRewardBundle(player, rewards) {
    const remaining = [];
    let failure = false;
    for (const reward of rewards) {
        if (failure) {
            remaining.push(reward);
            continue;
        }
        const ok = giveOrDrop(player, reward.itemId, reward.amount);
        if (!ok) {
            logger_js_1.logger.warn("rewardService", "Failed reward grant", { playerId: player.id, itemId: reward.itemId, amount: reward.amount });
            remaining.push(reward);
            failure = true;
        }
    }
    return { ok: !failure, remaining };
}
function giveOrDrop(player, itemId, amount) {
    try {
        const inv = player.getComponent("minecraft:inventory")?.container;
        const stack = new server_1.ItemStack(itemId, amount);
        if (inv) {
            const leftover = inv.addItem(stack);
            if (!leftover)
                return true;
            player.dimension.spawnItem(leftover, player.location);
            return true;
        }
        player.dimension.spawnItem(stack, player.location);
        return true;
    }
    catch (e) {
        logger_js_1.logger.error("rewardService", "giveOrDrop error", { playerId: player.id, itemId, amount, error: String(e) });
        return false;
    }
}
