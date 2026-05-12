import type { RewardDefinition } from "../types/domain.js";

export const QUESTS: Readonly<Record<string, Readonly<Record<string, ReadonlyArray<number>>>>> = {
  travel: {
    horizontal_distance: [250, 1000, 3000, 7000, 15000],
    swim_distance: [50, 250, 750, 1500, 3000],
    jump_count: [100, 500, 1500, 3000, 6000],
    fall_distance: [30, 100, 250, 500, 1000],
    boat_distance: [120, 600, 1800, 3600, 7200],
    glide_distance: [150, 700, 2100, 4200, 8400],
  },
  blocksBroken: {
    ground: [64, 256, 512, 1024, 2048],
    ore: [16, 64, 128, 256, 512],
    fauna: [32, 128, 256, 512, 1024],
    decorative: [64, 256, 512, 1024, 2048],
  },
  blocksPlaced: {
    ground: [64, 256, 512, 1024, 2048],
    ore: [16, 64, 128, 256, 512],
    fauna: [32, 128, 256, 512, 1024],
    decorative: [64, 256, 512, 1024, 2048],
  },
  combat: {
    hostile_mobs_killed: [5, 20, 50, 100, 200],
    non_hostile_mobs_killed: [5, 20, 50, 100, 200],
    damage_taken: [100, 500, 1500, 4000, 8000],
    damage_dealt: [100, 500, 1500, 4000, 8000],
    gear_crafted: [1, 5, 15, 30, 60],
    gear_smelted: [1, 5, 15, 30, 60],
    gear_broken: [1, 5, 15, 30, 60],
  },
};

export const QUEST_REWARD: ReadonlyArray<RewardDefinition> = [
  { itemId: "minecraft:torch", amount: 16 },
  { itemId: "minecraft:cooked_beef", amount: 6 },
];
