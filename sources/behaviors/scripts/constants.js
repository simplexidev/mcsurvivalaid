"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINECRAFT_DAY_TICKS = exports.TICKS_PER_SECOND = exports.RECURRING_REWARD_INTERVAL = exports.RECURRING_REWARD_START_DAY = exports.CLASS_REWARD_DAYS = exports.CLASSES = exports.ADDON = void 0;
exports.ADDON = {
    namespace: "survival_aid",
    name: "Survival Aid",
    author: "SimplexiDev",
    blocks: {
        survivalChest: "survival_aid:survival_aid_chest"
    },
    items: {
        bookOfSurvival: "survival_aid:book_of_survival"
    },
    components: {
        survivalChest: "survival_aid:survival_aid_chest_component",
        bookOfSurvival: "survival_aid:book_of_survival_component"
    }
};
exports.CLASSES = {
    adventurer: "Adventurer",
    warrior: "Warrior",
    miner: "Miner",
    mage: "Mage"
};
exports.CLASS_REWARD_DAYS = [3, 7, 10, 15, 20];
exports.RECURRING_REWARD_START_DAY = 30;
exports.RECURRING_REWARD_INTERVAL = 10;
exports.TICKS_PER_SECOND = 20;
exports.MINECRAFT_DAY_TICKS = 24000;
