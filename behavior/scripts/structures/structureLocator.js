import { ActionFormData } from "@minecraft/server-ui";

const STRUCTURE_TYPES = [
  "village",
  "shipwreck",
  "desert_pyramid",
  "jungle_pyramid",
  "pillager_outpost",
  "stronghold",
  "ancient_city",
  "trail_ruins",
  "mineshaft",
  "monument",
  "fortress",
  "bastion_remnant"
];

export async function showStructureLocatorMenu(player) {
  const form = new ActionFormData()
    .title("Structure Locator")
    .body("Choose a structure type.");

  for (const structure of STRUCTURE_TYPES) {
    form.button(formatStructureName(structure));
  }

  const result = await form.show(player);

  if (result.canceled || result.selection === undefined) {
    return;
  }

  const selected = STRUCTURE_TYPES[result.selection];

  // TODO:
  // Implement actual structure location strategy.
  // Possible strategies:
  // 1. Command-backed locator.
  // 2. Discovered-structure registry.
  // 3. Entity/helper-based scanning pattern.
  player.sendMessage(`Structure locator selected: ${formatStructureName(selected)}.`);
}

function formatStructureName(value) {
  return value
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}