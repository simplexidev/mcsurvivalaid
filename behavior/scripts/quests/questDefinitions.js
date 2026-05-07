export const QUESTS = {
  travel: { walk: [250, 1000, 3000, 7000, 15000] },
  blocksBroken: { ground: [64, 256, 512, 1024, 2048], ore: [16, 64, 128, 256, 512] },
  blocksPlaced: { ground: [64, 256, 512, 1024, 2048] },
  combat: { hostile_kills: [5, 20, 50, 100, 200], damage_dealt: [100, 500, 1500, 4000, 8000] }
};

export const QUEST_REWARD = [{ itemId: "minecraft:torch", amount: 16 }, { itemId: "minecraft:cooked_beef", amount: 6 }];
