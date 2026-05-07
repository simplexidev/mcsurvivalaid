import { world, system, ItemStack } from "@minecraft/server";
import { CLASS_REWARDS, CLASSLESS_RECURRING_REWARD } from "./rewardDefinitions.js";
import { getEarnedClassRewardDays } from "./rewardSchedule.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { collectReadyItemRequests } from "../items/requestService.js";

export function tickRewardService() {
  for (const player of world.getPlayers()) {
    const state = getPlayerState(player);
    if (!state.enabled || !state.classTrack.currentClass) continue;
    const worldDay = getCurrentWorldDay();
    const classTrackDays = Math.max(0, worldDay - state.classTrack.classTrackStartDay);
    const earnedDays = getEarnedClassRewardDays(classTrackDays, state.classTrack.claimedClassRewardDays, state.classTrack.pendingClassRewardDays);
    if (earnedDays.length > 0) {
      state.classTrack.pendingClassRewardDays.push(...earnedDays);
      setPlayerState(player, state);
    }
  }
}

export function hasPendingRewards(player) {
  const state = getPlayerState(player);
  return state.classTrack.pendingClassRewardDays.length > 0 || state.quests.pendingQuestRewards.length > 0 || state.requests.active.some(r => !r.claimed && r.readyAtTick <= system.currentTick);
}

export function claimPendingRewards(player) {
  const state = getPlayerState(player);
  if (!state.enabled || !state.classTrack.currentClass) return player.sendMessage("Survival Aid rewards are not enabled.");
  let claimedSomething = false;

  for (const rewardDay of [...state.classTrack.pendingClassRewardDays]) {
    for (const reward of getClassRewardsForDay(state.classTrack.currentClass, rewardDay)) giveOrDrop(player, reward.itemId, reward.amount);
    state.classTrack.claimedClassRewardDays.push(rewardDay); claimedSomething = true;
  }
  state.classTrack.pendingClassRewardDays = [];

  for (const quest of [...state.quests.pendingQuestRewards]) {
    for (const reward of quest.rewards) giveOrDrop(player, reward.itemId, reward.amount);
    state.quests.claimedQuestRewards.push(quest.token);
    claimedSomething = true;
  }
  state.quests.pendingQuestRewards = [];

  for (const req of collectReadyItemRequests(state)) {
    giveOrDrop(player, req.itemId, req.quantity);
    claimedSomething = true;
  }

  setPlayerState(player, state);
  player.sendMessage(claimedSomething ? "Claimed Survival Aid rewards." : "No Survival Aid rewards are ready.");
}

export function getCurrentWorldDay() { return Math.floor(world.getAbsoluteTime() / 24000); }
function getClassRewardsForDay(classId, rewardDay) { return CLASS_REWARDS[classId]?.[rewardDay] ?? CLASSLESS_RECURRING_REWARD; }
function giveOrDrop(player, itemId, amount) { const inv = player.getComponent("minecraft:inventory")?.container; const stack = new ItemStack(itemId, amount); if (inv && !inv.addItem(stack)) return; player.dimension.spawnItem(stack, player.location); }
