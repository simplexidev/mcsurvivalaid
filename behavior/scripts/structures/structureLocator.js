import { ActionFormData } from "@minecraft/server-ui";
import { findNearestKnownStructure, registerKnownStructure } from "../state/worldState.js";

const STRUCTURE_TYPES = ["village","shipwreck","desert_pyramid","jungle_pyramid","pillager_outpost","stronghold","ancient_city","trail_ruins","mineshaft","monument","fortress","bastion_remnant"];

export async function showStructureLocatorMenu(player) {
  const form = new ActionFormData().title("Structure Locator").body("Choose a structure type.");
  for (const s of STRUCTURE_TYPES) form.button(formatStructureName(s));
  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  const selected = STRUCTURE_TYPES[result.selection];
  await showStructureActionMenu(player, selected);
}

async function showStructureActionMenu(player, selected) {
  const form = new ActionFormData().title(formatStructureName(selected)).button("Locate Automatically").button("Register Current Position as Known");
  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  if (result.selection === 1) {
    registerKnownStructure(selected, player.dimension.id, player.location.x, player.location.y, player.location.z);
    player.sendMessage(`Registered current position as known ${formatStructureName(selected)}.`);
    return;
  }

  try {
    const res = await player.runCommandAsync(`locate structure ${selected}`);
    const msg = res.statusMessage ?? "Located.";
    const coords = parseFirstCoords(msg);
    if (!coords) return player.sendMessage(msg);
    sendDirectionMessage(player, selected, coords.x, coords.z);
  } catch {
    const known = findNearestKnownStructure(selected, player.dimension.id, player.location.x, player.location.z);
    if (!known) return player.sendMessage(`Locate unavailable and no known ${formatStructureName(selected)} registered in this dimension.`);
    sendDirectionMessage(player, selected, known.x, known.z, "(known registry)");
  }
}

function sendDirectionMessage(player, selected, x, z, suffix = "") {
  const dx = x - player.location.x;
  const dz = z - player.location.z;
  const dist = Math.round(Math.sqrt(dx * dx + dz * dz));
  const dir = directionFromVector(dx, dz);
  player.sendMessage(`${formatStructureName(selected)}${suffix ? ` ${suffix}` : ""}: ${dir}, ~${dist} blocks away at (${Math.floor(x)}, ${Math.floor(z)}).`);
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
