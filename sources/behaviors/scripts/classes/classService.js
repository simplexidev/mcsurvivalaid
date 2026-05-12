"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setInitialClass = setInitialClass;
exports.maybePromptClassChange = maybePromptClassChange;
const playerState_js_1 = require("../state/playerState.js");
function setInitialClass(player, classId) {
    const state = (0, playerState_js_1.getPlayerState)(player);
    state.enabled = true;
    state.hasSeenInitialPrompt = true;
    state.classTrack.currentClass = classId;
    (0, playerState_js_1.setPlayerState)(player, state);
}
function maybePromptClassChange(_player, _worldDay) {
    // TODO: future class change prompt flow.
}
