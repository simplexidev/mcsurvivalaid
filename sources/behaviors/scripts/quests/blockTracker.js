import { world } from "@minecraft/server";
import { addQuestProgress } from "./questService.js";

const GROUND_TAGS = ["dirt", "sand", "gravel", "grass", "mud", "clay", "mycelium", "podzol", "stone", "deepslate", "netherrack", "end_stone"];
const ORE_TAGS = ["ore", "quartz", "ancient_debris", "raw_iron_block", "raw_gold_block", "raw_copper_block"];
const FAUNA_TAGS = ["log", "leaves", "flower", "sapling", "mangrove", "azalea", "crop", "bamboo", "vine", "cactus", "melon", "pumpkin"];

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
  if (includesAny(typeId, ORE_TAGS)) return "ore";
  if (includesAny(typeId, GROUND_TAGS)) return "ground";
  if (includesAny(typeId, FAUNA_TAGS)) return "fauna";
  return "decorative";
}

function includesAny(value, tags) {
  return tags.some(tag => value.includes(tag));
}
