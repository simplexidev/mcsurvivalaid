export const CLASS_REWARDS = {
  adventurer: {
    3: [{ itemId: "minecraft:bread", amount: 8 }],
    7: [{ itemId: "minecraft:torch", amount: 32 }],
    10: [{ itemId: "minecraft:compass", amount: 1 }],
    15: [{ itemId: "minecraft:iron_pickaxe", amount: 1 }],
    20: [{ itemId: "minecraft:golden_apple", amount: 1 }]
  },

  warrior: {
    3: [{ itemId: "minecraft:stone_sword", amount: 1 }],
    7: [{ itemId: "minecraft:shield", amount: 1 }],
    10: [{ itemId: "minecraft:iron_sword", amount: 1 }],
    15: [{ itemId: "minecraft:iron_chestplate", amount: 1 }],
    20: [{ itemId: "minecraft:golden_apple", amount: 2 }]
  },

  miner: {
    3: [{ itemId: "minecraft:stone_pickaxe", amount: 1 }],
    7: [{ itemId: "minecraft:coal", amount: 16 }],
    10: [{ itemId: "minecraft:iron_pickaxe", amount: 1 }],
    15: [{ itemId: "minecraft:raw_iron", amount: 16 }],
    20: [{ itemId: "minecraft:diamond_pickaxe", amount: 1 }]
  },

  mage: {
    3: [{ itemId: "minecraft:glass_bottle", amount: 3 }],
    7: [{ itemId: "minecraft:lapis_lazuli", amount: 16 }],
    10: [{ itemId: "minecraft:experience_bottle", amount: 8 }],
    15: [{ itemId: "minecraft:brewing_stand", amount: 1 }],
    20: [{ itemId: "minecraft:enchanting_table", amount: 1 }]
  }
};

export const CLASSLESS_RECURRING_REWARD = [
  { itemId: "minecraft:bread", amount: 16 },
  { itemId: "minecraft:torch", amount: 32 },
  { itemId: "minecraft:experience_bottle", amount: 4 }
];

export const QUEST_REWARDS = {
  travel_1: [{ itemId: "minecraft:leather_boots", amount: 1 }],
  combat_1: [{ itemId: "minecraft:arrow", amount: 16 }],
  mining_1: [{ itemId: "minecraft:coal", amount: 16 }]
};