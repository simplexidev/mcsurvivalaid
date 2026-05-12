import type { Entity, Player } from "@minecraft/server";

export function isPlayer(entity: Entity | Player | undefined | null): entity is Player {
  return !!entity && entity.typeId === "minecraft:player";
}
