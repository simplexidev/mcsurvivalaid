import { world } from "@minecraft/server";
import { addQuestProgress } from "./questService.js";

const lastPositions = new Map();

export function tickTravelTracking() {
  for (const player of world.getPlayers()) {
    const previous = lastPositions.get(player.id);
    const current = player.location;

    if (previous && previous.dimensionId === player.dimension.id) {
      const dx = current.x - previous.x;
      const dy = current.y - previous.y;
      const dz = current.z - previous.z;
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

      if (horizontalDistance > 0.01 && horizontalDistance < 20) {
        addQuestProgress(player, "travel", "horizontal_distance", horizontalDistance);
      }

      if (player.isSwimming && horizontalDistance > 0.01 && horizontalDistance < 20) {
        addQuestProgress(player, "travel", "swim_distance", horizontalDistance);
      }

      if (dy > 0.42 && dy < 3) {
        addQuestProgress(player, "travel", "jump_count", 1);
      }

      if (dy < -2 && Math.abs(dy) < 40) {
        addQuestProgress(player, "travel", "fall_distance", Math.abs(dy));
      }
    }

    lastPositions.set(player.id, { x: current.x, y: current.y, z: current.z, dimensionId: player.dimension.id });
  }
}
