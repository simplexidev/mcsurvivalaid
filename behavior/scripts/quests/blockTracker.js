import { world } from "@minecraft/server";
import { addQuestProgress } from "./questService.js";

export function registerBlockQuestTracking() {
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const category = classifyBlock(event.brokenBlockPermutation.type.id);
    addQuestProgress(event.player, "blocksBroken", category, 1);
  });

  world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const category = classifyBlock(event.block.typeId);
    addQuestProgress(event.player, "blocksPlaced", category, 1);
  });
}

function classifyBlock(typeId) {
  if (typeId.includes("ore") || typeId.includes("quartz")) {
    return "ore";
  }

  if (
    typeId.includes("dirt") ||
    typeId.includes("sand") ||
    typeId.includes("gravel") ||
    typeId.includes("grass")
  ) {
    return "ground";
  }

  if (
    typeId.includes("log") ||
    typeId.includes("leaves") ||
    typeId.includes("flower") ||
    typeId.includes("sapling")
  ) {
    return "fauna";
  }

  return "decorative";
}