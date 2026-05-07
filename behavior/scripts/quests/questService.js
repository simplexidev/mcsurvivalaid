import { getPlayerState, setPlayerState } from "../state/playerState.js";

export function addQuestProgress(player, category, key, amount) {
  const state = getPlayerState(player);

  if (!state.quests[category]) {
    state.quests[category] = {};
  }

  state.quests[category][key] = (state.quests[category][key] ?? 0) + amount;

  // TODO: Evaluate quest thresholds and add pending quest rewards.
  setPlayerState(player, state);
}