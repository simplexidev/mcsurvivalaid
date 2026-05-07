export const CLASS_DEFINITIONS = {
  adventurer: {
    id: "adventurer",
    name: "Adventurer",
    description: "Survival and overworld exploration."
  },
  warrior: {
    id: "warrior",
    name: "Warrior",
    description: "Fighting and defense."
  },
  miner: {
    id: "miner",
    name: "Miner",
    description: "Mining, ore processing, and automation."
  },
  mage: {
    id: "mage",
    name: "Mage",
    description: "Enchanting, brewing, and magical progression."
  }
};

export function getClassList() {
  return Object.values(CLASS_DEFINITIONS);
}