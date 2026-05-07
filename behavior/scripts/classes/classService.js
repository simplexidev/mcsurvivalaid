import { getCurrentWorldDay } from "../rewards/rewardService.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";

export function setInitialClass(player, classId) {
  const state = getPlayerState(player);
  const worldDay = getCurrentWorldDay();

  state.enabled = true;
  state.classTrack.currentClass = classId;
  state.classTrack.classTrackStartDay = worldDay;
  state.classTrack.lastDeathDay = worldDay;
  state.classTrack.claimedClassRewardDays = [];
  state.classTrack.pendingClassRewardDays = [];
  state.classTrack.nextClassChangePromptDay = 20;

  setPlayerState(player, state);
}

export function changeClass(player, newClassId) {
  const state = getPlayerState(player);
  const oldClass = state.classTrack.currentClass;

  if (oldClass && !state.classTrack.completedClasses.includes(oldClass)) {
    state.classTrack.completedClasses.push(oldClass);
  }

  const worldDay = getCurrentWorldDay();

  state.classTrack.currentClass = newClassId;
  state.classTrack.classTrackStartDay = worldDay;
  state.classTrack.claimedClassRewardDays = [];
  state.classTrack.pendingClassRewardDays = [];
  state.classTrack.nextClassChangePromptDay = worldDay + 10;

  setPlayerState(player, state);
}