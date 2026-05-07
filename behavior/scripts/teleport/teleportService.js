import { world, system } from "@minecraft/server";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { getCurrentWorldDay } from "../rewards/rewardService.js";

export function handlePlayerDeath(event) {
  const dead = event.deadEntity;
  if (!dead || dead.typeId !== "minecraft:player") return;
  const state = getPlayerState(dead);
  const location = dead.location;
  state.deaths.lastDeathLocation = { dimension: dead.dimension.id, x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z), tick: system.currentTick, day: getCurrentWorldDay() };
  const worldDay = getCurrentWorldDay();
  state.classTrack.lastDeathDay = worldDay;
  state.classTrack.classTrackStartDay = worldDay;
  setPlayerState(dead, state);
}

function canUseCooldown(player, key) {
  const state = getPlayerState(player);
  if (system.currentTick < state.cooldowns[key]) {
    const remain = Math.ceil((state.cooldowns[key] - system.currentTick) / 20);
    player.sendMessage(`Teleport cooldown: ${remain}s remaining.`);
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
    const target = spawn ?? { dimension: player.dimension.id, ...world.getDefaultSpawnLocation() };
    const dimension = target.dimension ? world.getDimension(target.dimension) : player.dimension;
    player.teleport({ x: target.x + 0.5, y: target.y + 1, z: target.z + 0.5 }, { dimension });
    player.sendMessage("Teleported to respawn.");
  } catch (e) {
    player.sendMessage("Teleport to respawn failed.");
    console.warn(`Survival Aid teleportToRespawn failed: ${e}`);
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
    player.teleport({ x: lastDeath.x + 0.5, y: lastDeath.y + 2, z: lastDeath.z + 0.5 }, { dimension });
    player.sendMessage(`Teleported to last death (${lastDeath.x}, ${lastDeath.y}, ${lastDeath.z}).`);
  } catch (e) {
    player.sendMessage("Teleport to last death failed. Dimension/location unavailable.");
    console.warn(`Survival Aid teleportToLastDeath failed: ${e}`);
  }
}
