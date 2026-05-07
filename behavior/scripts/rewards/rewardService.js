import { world, ItemStack } from "@minecraft/server";
import { CLASS_REWARDS, CLASSLESS_RECURRING_REWARD } from "./rewardDefinitions.js";
import { getEarnedClassRewardDays } from "./rewardSchedule.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";

export function tickRewardService() {
  for (const player of world.getPlayers()) {
    const state = getPlayerState(player);

    if (!state.enabled || !state.classTrack.currentClass) {
      continue;
    }

    const worldDay = getCurrentWorldDay();
    const classTrackDays = Math.max(0, worldDay - state.classTrack.classTrackStartDay);

    const earnedDays = getEarnedClassRewardDays(
      classTrackDays,
      state.classTrack.claimedClassRewardDays,
      state.classTrack.pendingClassRewardDays
    );

    if (earnedDays.length > 0) {
      state.classTrack.pendingClassRewardDays.push(...earnedDays);
      setPlayerState(player, state);
    }
  }
}

export function hasPendingRewards(player) {
  const state = getPlayerState(player);

  return state.classTrack.pendingClassRewardDays.length > 0 ||
    state.quests.pendingQuestRewards.length > 0 ||
    state.requests.active.some(request => !request.claimed && request.readyAtTick <= system.currentTick);
}

export function claimPendingRewards(player) {
  const state = getPlayerState(player);

  if (!state.enabled || !state.classTrack.currentClass) {
    player.sendMessage("Survival Aid rewards are not enabled.");
    return;
  }

  const pendingDays = [...state.classTrack.pendingClassRewardDays];

  if (pendingDays.length === 0) {
    player.sendMessage("No Survival Aid rewards are ready.");
    return;
  }

  for (const rewardDay of pendingDays) {
    const rewards = getClassRewardsForDay(state.classTrack.currentClass, rewardDay);

    for (const reward of rewards) {
      giveOrDrop(player, reward.itemId, reward.amount);
    }

    state.classTrack.claimedClassRewardDays.push(rewardDay);
  }

  state.classTrack.pendingClassRewardDays = [];

  setPlayerState(player, state);
  player.sendMessage("Claimed Survival Aid rewards.");
}

export function getCurrentWorldDay() {
  return Math.floor(world.getAbsoluteTime() / 24000);
}

function getClassRewardsForDay(classId, rewardDay) {
  const exact = CLASS_REWARDS[classId]?.[rewardDay];

  if (exact) {
    return exact;
  }

  return CLASSLESS_RECURRING_REWARD;
}

function giveOrDrop(player, itemId, amount) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  const stack = new ItemStack(itemId, amount);

  if (inventory) {
    const leftover = inventory.addItem(stack);

    if (!leftover) {
      return;
    }
  }

  player.dimension.spawnItem(stack, player.location);
}