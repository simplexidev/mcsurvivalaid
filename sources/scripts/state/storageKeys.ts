export const STORAGE_KEYS = {
  playerStatePrefix: "survival_aid:survival_aid:player:",
  worldState: "survival_aid:survival_aid:world"
};

export function getPlayerStateKey(player) {
  return `${STORAGE_KEYS.playerStatePrefix}${player.id}`;
}