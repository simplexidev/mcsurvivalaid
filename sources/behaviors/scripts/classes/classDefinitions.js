"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassList = getClassList;
const CLASSES = [
    { id: "adventurer", name: "Adventurer", description: "Balanced starter class." },
    { id: "warrior", name: "Warrior", description: "Combat-focused class." },
    { id: "miner", name: "Miner", description: "Resource-focused class." },
    { id: "mage", name: "Mage", description: "Utility-focused class." }
];
function getClassList() { return CLASSES; }
