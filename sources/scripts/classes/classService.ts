import { getPlayerState, setPlayerState } from "../state/playerState.js";
import type { ClassId } from "./classDefinitions.js";

export function setInitialClass(player, classId: ClassId): void {
  const state = getPlayerState(player);
  state.enabled = true;
  state.hasSeenInitialPrompt = true;
  state.classTrack.currentClass = classId;
  setPlayerState(player, state);
}

export function maybePromptClassChange(_player, _worldDay: number): void {
  // TODO: future class change prompt flow.
}
