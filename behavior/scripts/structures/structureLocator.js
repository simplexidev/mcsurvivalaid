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
    const msg = res.statusMessage ?? "Located.";
    const coords = parseFirstCoords(msg);
    if (!coords) return player.sendMessage(msg);
    const dx = coords.x - player.location.x;
    const dz = coords.z - player.location.z;
    const dist = Math.round(Math.sqrt(dx * dx + dz * dz));
    const dir = directionFromVector(dx, dz);
    player.sendMessage(`${formatStructureName(selected)}: ${dir}, ~${dist} blocks away at (${coords.x}, ${coords.z}).`);
  } catch {
    player.sendMessage(`Could not locate ${formatStructureName(selected)} automatically on this world/build.`);
  }
}

function parseFirstCoords(text) {
  const m = text.match(/(-?\d+)\s+(-?\d+)\s+(-?\d+)/);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]), z: Number(m[3]) };
}

function directionFromVector(dx, dz) {
  const angle = (Math.atan2(dz, dx) * 180 / Math.PI + 360) % 360;
  const dirs = ["East","Northeast","North","Northwest","West","Southwest","South","Southeast"];
  return dirs[Math.round(angle / 45) % 8];
}

function formatStructureName(value) { return value.split("_").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" "); }
