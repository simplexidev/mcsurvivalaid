import { world, system, ItemStack } from "@minecraft/server";
import { CLASS_REWARDS, CLASSLESS_RECURRING_REWARD } from "./rewardDefinitions.js";
import { getEarnedClassRewardDays } from "./rewardSchedule.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { collectReadyItemRequests } from "../items/requestService.js";
import { maybePromptClassChange } from "../classes/classService.js";

export function tickRewardService() {
  for (const player of world.getPlayers()) {
    const state = getPlayerState(player);
    if (!state.enabled || !state.classTrack.currentClass) continue;
    const worldDay = getCurrentWorldDay();
    maybePromptClassChange(player, worldDay);
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
  if (!state.enabled) return player.sendMessage("Survival Aid rewards are not enabled.");
  let grantedAny = false;

  if (state.classTrack.currentClass) {
    const keepPendingClass = [];
    for (const rewardDay of [...state.classTrack.pendingClassRewardDays]) {
      const ok = grantRewardBundle(player, getClassRewardsForDay(state.classTrack.currentClass, rewardDay));
      if (ok) {
        state.classTrack.claimedClassRewardDays.push(rewardDay);
        if (rewardDay >= 20) state.classTrack.tier5ClaimedCurrent = true;
        grantedAny = true;
      } else {
        keepPendingClass.push(rewardDay);
      }
    }
    state.classTrack.pendingClassRewardDays = keepPendingClass;
  }

  const keepPendingQuests = [];
  for (const quest of [...state.quests.pendingQuestRewards]) {
    const ok = grantRewardBundle(player, quest.rewards);
    if (ok) {
      state.quests.claimedQuestRewards.push(quest.token);
      grantedAny = true;
    } else {
      keepPendingQuests.push(quest);
    }
  }
  state.quests.pendingQuestRewards = keepPendingQuests;

  const readyRequests = collectReadyItemRequests(state);
  for (const req of readyRequests) {
    const ok = giveOrDrop(player, req.itemId, req.quantity);
    if (!ok) {
      req.claimed = false;
    } else {
      grantedAny = true;
    }
  }

  setPlayerState(player, state);
  player.sendMessage(grantedAny ? "Claimed Survival Aid rewards." : "No Survival Aid rewards are ready.");
}

export function getCurrentWorldDay() { return Math.floor(world.getAbsoluteTime() / 24000); }
function getClassRewardsForDay(classId, rewardDay) { return CLASS_REWARDS[classId]?.[rewardDay] ?? CLASSLESS_RECURRING_REWARD; }

function grantRewardBundle(player, rewards) {
  for (const reward of rewards) {
    const ok = giveOrDrop(player, reward.itemId, reward.amount);
    if (!ok) {
      console.warn(`Survival Aid failed reward grant for ${reward.itemId} x${reward.amount}`);
      return false;
    }
  }
  return true;
}

function giveOrDrop(player, itemId, amount) {
  try {
    const inv = player.getComponent("minecraft:inventory")?.container;
    const stack = new ItemStack(itemId, amount);
    if (inv) {
      const leftover = inv.addItem(stack);
      if (!leftover) return true;
      player.dimension.spawnItem(leftover, player.location);
      return true;
    }
    player.dimension.spawnItem(stack, player.location);
    return true;
  } catch (e) {
    console.warn(`Survival Aid giveOrDrop error: ${e}`);
    return false;
  }
}
