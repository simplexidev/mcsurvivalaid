import { ActionFormData } from "@minecraft/server-ui";

const STRUCTURE_TYPES = ["village","shipwreck","desert_pyramid","jungle_pyramid","pillager_outpost","stronghold","ancient_city","trail_ruins","mineshaft","monument","fortress","bastion_remnant"];

export async function showStructureLocatorMenu(player) {
  const form = new ActionFormData().title("Structure Locator").body("Choose a structure type.");
  for (const s of STRUCTURE_TYPES) form.button(formatStructureName(s));
  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  const selected = STRUCTURE_TYPES[result.selection];
  try {
    const res = await player.runCommandAsync(`locate structure ${selected}`);
    const out = res.statusMessage ?? "Located.";
    player.sendMessage(out);
  } catch {
    player.sendMessage(`Could not locate ${formatStructureName(selected)} automatically on this world/build.`);
  }
}

function formatStructureName(value) { return value.split("_").map(p => p.charAt(0).toUpperCase()+p.slice(1)).join(" "); }
