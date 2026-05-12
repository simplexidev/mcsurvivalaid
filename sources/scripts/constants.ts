import { ClassId } from "./types/domain.js";

export const ADDON = {
  namespace: "survival_aid",
  name: "Survival Aid",
  author: "SimplexiDev",
  blocks: { survivalChest: "survival_aid:survival_aid_chest" },
  items: { bookOfSurvival: "survival_aid:book_of_survival" },
  components: {
    survivalChest: "survival_aid:survival_aid_chest_component",
    bookOfSurvival: "survival_aid:book_of_survival_component",
  },
} as const;

export const CLASSES: Readonly<Record<ClassId, string>> = {
  [ClassId.Adventurer]: "Adventurer",
  [ClassId.Warrior]: "Warrior",
  [ClassId.Miner]: "Miner",
  [ClassId.Mage]: "Mage",
};

export const CLASS_REWARD_DAYS: ReadonlyArray<number> = [3, 7, 10, 15, 20];
export const RECURRING_REWARD_START_DAY = 30;
export const RECURRING_REWARD_INTERVAL = 10;
export const TICKS_PER_SECOND = 20;
export const MINECRAFT_DAY_TICKS = 24000;
