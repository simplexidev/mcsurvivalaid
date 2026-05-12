"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQuestProgress = addQuestProgress;
const playerState_js_1 = require("../state/playerState.js");
const questDefinitions_js_1 = require("./questDefinitions.js");
function questKey(category, key, tier) { return `${category}:${key}:${tier}`; }
function addQuestProgress(player, category, key, amount) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    if (!state.quests[category])
        state.quests[category] = {};
    state.quests[category][key] = (state.quests[category][key] ?? 0) + amount;
    const thresholds = questDefinitions_js_1.QUESTS[category]?.[key] ?? [];
    thresholds.forEach((threshold, idx) => {
        const token = questKey(category, key, idx + 1);
        const already = state.quests.claimedQuestRewards.includes(token) || state.quests.pendingQuestRewards.some(q => q.token === token);
        if (!already && state.quests[category][key] >= threshold) {
            state.quests.pendingQuestRewards.push({ token, rewards: questDefinitions_js_1.QUEST_REWARD });
        }
    });
    (0, playerState_js_1.setPlayerState)(player, state);
}
