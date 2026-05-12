import type { Entity, Player } from "@minecraft/server";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { QUESTS, QUEST_REWARD } from "./questDefinitions.js";
import type { QuestCategory } from "../types/domain.js";

function questKey(category: QuestCategory, key: string, tier: number): string { return `${category}:${key}:${tier}`; }

function isPlayer(entity: Entity | Player): entity is Player { return entity.typeId === "minecraft:player"; }

export function addQuestProgress(player: Entity | Player, category: QuestCategory, key: string, amount: number): void {
  if (!isPlayer(player)) return;
  const state = getPlayerState(player);
  if (!state.quests[category]) state.quests[category] = {};
  state.quests[category][key] = (state.quests[category][key] ?? 0) + amount;

  const thresholds = QUESTS[category]?.[key] ?? [];
  thresholds.forEach((threshold, idx) => {
    const token = questKey(category, key, idx + 1);
    const already = state.quests.claimedQuestRewards.includes(token) || state.quests.pendingQuestRewards.some(q => q.token === token);
    if (!already && state.quests[category][key] >= threshold) {
      state.quests.pendingQuestRewards.push({ token, rewards: [...QUEST_REWARD] });
    }
  });
  setPlayerState(player, state);
}
