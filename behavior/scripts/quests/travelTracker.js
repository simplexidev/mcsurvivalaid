import { world } from "@minecraft/server";
import { addQuestProgress } from "./questService.js";

const lastPositions = new Map();

export function tickTravelTracking() {
  for (const player of world.getPlayers()) {
    const previous = lastPositions.get(player.id);
    const current = player.location;

    if (previous && previous.dimensionId === player.dimension.id) {
      const dx = current.x - previous.x;
      const dz = current.z - previous.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance > 0.01 && distance < 20) {
        addQuestProgress(player, "travel", "horizontal_distance", distance);
      }
    }

    lastPositions.set(player.id, {
      x: current.x,
      y: current.y,
      z: current.z,
      dimensionId: player.dimension.id
    });
  }
}