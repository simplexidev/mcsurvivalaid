import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { getCurrentWorldDay } from "../rewards/rewardService.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { getClassList } from "./classDefinitions.js";

const activePrompts = new Set();

export function setInitialClass(player, classId) {
  const state = getPlayerState(player);
  const worldDay = getCurrentWorldDay();
  state.hasSeenInitialPrompt = true;
  state.enabled = true;
  state.classTrack.currentClass = classId;
  state.classTrack.classTrackStartDay = worldDay;
  state.classTrack.lastDeathDay = worldDay;
  state.classTrack.claimedClassRewardDays = [];
  state.classTrack.pendingClassRewardDays = [];
  state.classTrack.nextClassChangePromptDay = worldDay + 20;
  setPlayerState(player, state);
}

export function changeClass(player, newClassId) {
  const state = getPlayerState(player);
  const oldClass = state.classTrack.currentClass;
  if (oldClass && !state.classTrack.completedClasses.includes(oldClass)) state.classTrack.completedClasses.push(oldClass);
  const worldDay = getCurrentWorldDay();
  state.classTrack.currentClass = newClassId;
  state.classTrack.classTrackStartDay = worldDay;
  state.classTrack.claimedClassRewardDays = [];
  state.classTrack.pendingClassRewardDays = [];
  state.classTrack.nextClassChangePromptDay = worldDay + 10;
  setPlayerState(player, state);
}

export async function maybePromptClassChange(player, worldDay) {
  if (activePrompts.has(player.id)) return;
  const state = getPlayerState(player);
  const daysSurvived = Math.max(0, worldDay - state.classTrack.lastDeathDay);
  if (daysSurvived < 20 || worldDay < state.classTrack.nextClassChangePromptDay) return;
  activePrompts.add(player.id);
  const confirm = await new MessageFormData().title("Class Change Available").body("You can change class now. Change class?").button1("Change").button2("Keep Current").show(player);
  if (confirm.canceled || confirm.selection !== 0) {
    state.classTrack.nextClassChangePromptDay = worldDay + 10; setPlayerState(player, state); activePrompts.delete(player.id); return;
  }
  const available = getClassList().filter(c => c.id !== state.classTrack.currentClass && !state.classTrack.completedClasses.includes(c.id));
  if (available.length === 0) { player.sendMessage("All classes completed or unavailable."); state.classTrack.nextClassChangePromptDay = worldDay + 10; setPlayerState(player,state); activePrompts.delete(player.id); return; }
  const form = new ActionFormData().title("Select New Class").body("Choose your new class track.");
  for (const c of available) form.button(`${c.name}\n${c.description}`);
  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) { state.classTrack.nextClassChangePromptDay = worldDay + 10; setPlayerState(player, state); activePrompts.delete(player.id); return; }
  changeClass(player, available[result.selection].id);
  player.sendMessage(`Class changed to ${available[result.selection].name}.`);
  activePrompts.delete(player.id);
}
