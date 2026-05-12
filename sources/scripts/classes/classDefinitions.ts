export type ClassId = "adventurer" | "warrior" | "miner" | "mage";
export interface ClassDefinition { id: ClassId; name: string; description: string }
const CLASSES: ClassDefinition[] = [
  { id: "adventurer", name: "Adventurer", description: "Balanced starter class." },
  { id: "warrior", name: "Warrior", description: "Combat-focused class." },
  { id: "miner", name: "Miner", description: "Resource-focused class." },
  { id: "mage", name: "Mage", description: "Utility-focused class." }
];
export function getClassList(): ClassDefinition[] { return CLASSES; }
