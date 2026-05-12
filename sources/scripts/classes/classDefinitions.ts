import { CLASSES } from "../constants.js";
import { ClassId } from "../types/domain.js";

export { ClassId };

export interface ClassDefinition { id: ClassId; name: string; description: string }

const CLASS_DEFINITIONS: ReadonlyArray<ClassDefinition> = [
  { id: ClassId.Adventurer, name: CLASSES[ClassId.Adventurer], description: "Balanced starter class." },
  { id: ClassId.Warrior, name: CLASSES[ClassId.Warrior], description: "Combat-focused class." },
  { id: ClassId.Miner, name: CLASSES[ClassId.Miner], description: "Resource-focused class." },
  { id: ClassId.Mage, name: CLASSES[ClassId.Mage], description: "Utility-focused class." }
];

export function getClassList(): ReadonlyArray<ClassDefinition> { return CLASS_DEFINITIONS; }
