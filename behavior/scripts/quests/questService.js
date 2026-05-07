import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { QUESTS, QUEST_REWARD } from "./questDefinitions.js";

function questKey(category, key, tier) { return `${category}:${key}:${tier}`; }

export function addQuestProgress(player, category, key, amount) {
  const state = getPlayerState(player);
  if (!state.quests[category]) state.quests[category] = {};
  state.quests[category][key] = (state.quests[category][key] ?? 0) + amount;

  const thresholds = QUESTS[category]?.[key] ?? [];
  thresholds.forEach((threshold, idx) => {
    const token = questKey(category, key, idx + 1);
    const already = state.quests.claimedQuestRewards.includes(token) || state.quests.pendingQuestRewards.some(q => q.token === token);
    if (!already && state.quests[category][key] >= threshold) {
      state.quests.pendingQuestRewards.push({ token, rewards: QUEST_REWARD });
    }
  });
  setPlayerState(player, state);
}
