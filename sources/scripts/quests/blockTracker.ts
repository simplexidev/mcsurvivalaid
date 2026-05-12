import { world } from "@minecraft/server";
import type { BlockMetricKey } from "../types/domain.js";
import { addQuestProgress } from "./questService.js";

const GROUND_TAGS: ReadonlyArray<string> = [
  "dirt",
  "sand",
  "gravel",
  "grass",
  "mud",
  "clay",
  "mycelium",
  "podzol",
  "stone",
  "deepslate",
  "netherrack",
  "end_stone",
];
const ORE_TAGS: ReadonlyArray<string> = [
  "ore",
  "quartz",
  "ancient_debris",
  "raw_iron_block",
  "raw_gold_block",
  "raw_copper_block",
];
const FAUNA_TAGS: ReadonlyArray<string> = [
  "log",
  "leaves",
  "flower",
  "sapling",
  "mangrove",
  "azalea",
  "crop",
  "bamboo",
  "vine",
  "cactus",
  "melon",
  "pumpkin",
];

function addBlockProgress(player, category: "blocksBroken" | "blocksPlaced", key: BlockMetricKey): void {
  addQuestProgress(player, category, key, 1);
}

export function registerBlockQuestTracking(): void {
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const category = classifyBlock(event.brokenBlockPermutation.type.id);
    addBlockProgress(event.player, "blocksBroken", category);
  });

  world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const category = classifyBlock(event.block.typeId);
    addBlockProgress(event.player, "blocksPlaced", category);
  });
}

function classifyBlock(typeId: string): BlockMetricKey {
  if (includesAny(typeId, ORE_TAGS)) return "ore";
  if (includesAny(typeId, GROUND_TAGS)) return "ground";
  if (includesAny(typeId, FAUNA_TAGS)) return "fauna";
  return "decorative";
}

function includesAny(value: string, tags: ReadonlyArray<string>): boolean {
  return tags.some((tag) => value.includes(tag));
}
