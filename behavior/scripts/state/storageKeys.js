export const STORAGE_KEYS = {
  playerStatePrefix: "simplexidev:survival_aid:player:",
  worldState: "simplexidev:survival_aid:world"
};

export function getPlayerStateKey(player) {
  return `${STORAGE_KEYS.playerStatePrefix}${player.id}`;
}