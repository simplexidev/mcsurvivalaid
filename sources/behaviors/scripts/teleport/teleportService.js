import { world, system } from "@minecraft/server";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { logger } from "../logging/logger.js";
import { getCurrentWorldDay } from "../rewards/rewardService.js";

export function handlePlayerDeath(event) {
  const dead = event.deadEntity;
  if (!dead || dead.typeId !== "minecraft:player") return;
  logger.info("teleportService", "Player death captured", { playerId: dead.id, dimension: dead.dimension.id });
  const state = getPlayerState(dead);
  const location = dead.location;
  state.deaths.lastDeathLocation = { dimension: dead.dimension.id, x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z), tick: system.currentTick, day: getCurrentWorldDay() };
  const worldDay = getCurrentWorldDay();
  state.classTrack.lastDeathDay = worldDay;
  state.classTrack.classTrackStartDay = worldDay;
  state.classTrack.tier5ClaimedCurrent = false;
  setPlayerState(dead, state);
}

function canUseCooldown(player, key) {
  const state = getPlayerState(player);
  if (system.currentTick < state.cooldowns[key]) {
    const remain = Math.ceil((state.cooldowns[key] - system.currentTick) / 20);
    player.sendMessage(`Teleport cooldown: ${remain}s remaining.`);
    logger.trace("teleportService", "Teleport cooldown active", { playerId: player.id, key, remainingTicks: state.cooldowns[key] - system.currentTick });
    return false;
  }
  state.cooldowns[key] = system.currentTick + (state.settings.teleportCooldownSeconds * 20);
  setPlayerState(player, state);
  return true;
}

export function teleportToRespawn(player) {
  const state = getPlayerState(player);
  if (!state.settings.allowTeleportToRespawn) return player.sendMessage("Teleport to Respawn is disabled.");
  if (!canUseCooldown(player, "respawnTeleportReadyTick")) return;
  try {
    const spawn = player.getSpawnPoint?.() ?? null;
    const savedRespawn = state.deaths.respawnLocation ?? null;
    const target = spawn ?? savedRespawn ?? { dimension: player.dimension.id, ...world.getDefaultSpawnLocation() };
    const dimension = target.dimension ? world.getDimension(target.dimension) : player.dimension;
    const safe = resolveSafeTarget(dimension, target.x + 0.5, target.y + 1, target.z + 0.5);
    if (!safe) return player.sendMessage("No safe respawn-adjacent position found.");
    player.teleport(safe, { dimension });
    applyPostTeleportSafety(player);
    player.sendMessage("Teleported to respawn.");
  } catch (e) {
    player.sendMessage("Teleport to respawn failed.");
    logger.error("teleportService", "teleportToRespawn failed", { playerId: player.id, error: String(e) });
  }
}

export function teleportToLastDeath(player) {
  const state = getPlayerState(player);
  if (!state.settings.allowTeleportToDeath) return player.sendMessage("Teleport to Last Death is disabled.");
  if (!canUseCooldown(player, "deathTeleportReadyTick")) return;
  const lastDeath = state.deaths.lastDeathLocation;
  if (!lastDeath) return player.sendMessage("No last death location has been recorded.");
  try {
    const dimension = world.getDimension(lastDeath.dimension);
    const safe = resolveSafeTarget(dimension, lastDeath.x + 0.5, lastDeath.y + 2, lastDeath.z + 0.5);
    if (!safe) return player.sendMessage("No safe last-death-adjacent position found.");
    player.teleport(safe, { dimension });
    applyPostTeleportSafety(player);
    player.sendMessage(`Teleported to last death (${lastDeath.x}, ${lastDeath.y}, ${lastDeath.z}).`);
  } catch (e) {
    player.sendMessage("Teleport to last death failed. Dimension/location unavailable.");
    logger.error("teleportService", "teleportToLastDeath failed", { playerId: player.id, error: String(e) });
  }
}

function resolveSafeTarget(dimension, x, y, z) {
  const offsets = [
    [0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1],[2,0],[-2,0],[0,2],[0,-2]
  ];
  for (const [ox, oz] of offsets) {
    for (let dy = 0; dy <= 6; dy++) {
      const tx = Math.floor(x + ox), ty = Math.floor(y + dy), tz = Math.floor(z + oz);
      if (isSafeStand(dimension, tx, ty, tz)) return { x: tx + 0.5, y: ty, z: tz + 0.5 };
    }
  }
  return null;
}

function isSafeStand(dimension, x, y, z) {
  try {
    const feet = dimension.getBlock({ x, y, z });
    const head = dimension.getBlock({ x, y: y + 1, z });
    const floor = dimension.getBlock({ x, y: y - 1, z });
    if (!feet || !head || !floor) return false;
    const feetAir = feet.isAir ?? feet.typeId === "minecraft:air";
    const headAir = head.isAir ?? head.typeId === "minecraft:air";
    const floorSolid = !(floor.isAir ?? floor.typeId === "minecraft:air");
    return feetAir && headAir && floorSolid;
  } catch {
    return false;
  }
}


function applyPostTeleportSafety(player) {
  try {
    player.runCommandAsync("effect @s resistance 6 1 true");
  } catch {}
}
