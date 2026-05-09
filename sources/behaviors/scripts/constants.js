export const ADDON = {
  namespace: "simplexidev",
  name: "Survival Aid",
  author: "SimplexiDev",

  blocks: {
    survivalChest: "simplexidev:survival_aid_chest"
  },

  items: {
    bookOfSurvival: "simplexidev:book_of_survival"
  },

  components: {
    survivalChest: "simplexidev:survival_aid_chest_component",
    bookOfSurvival: "simplexidev:book_of_survival_component"
  }
};

export const CLASSES = {
  adventurer: "Adventurer",
  warrior: "Warrior",
  miner: "Miner",
  mage: "Mage"
};

export const CLASS_REWARD_DAYS = [3, 7, 10, 15, 20];

export const RECURRING_REWARD_START_DAY = 30;
export const RECURRING_REWARD_INTERVAL = 10;

export const TICKS_PER_SECOND = 20;
export const MINECRAFT_DAY_TICKS = 24000;
