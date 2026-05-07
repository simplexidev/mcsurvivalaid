import { world } from "@minecraft/server";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { getCurrentWorldDay } from "../rewards/rewardService.js";

export function handlePlayerDeath(event) {
  const dead = event.deadEntity;

  if (!dead || dead.typeId !== "minecraft:player") {
    return;
  }

  const state = getPlayerState(dead);
  const location = dead.location;

  state.deaths.lastDeathLocation = {
    dimension: dead.dimension.id,
    x: Math.floor(location.x),
    y: Math.floor(location.y),
    z: Math.floor(location.z)
  };

  const worldDay = getCurrentWorldDay();

  state.classTrack.lastDeathDay = worldDay;
  state.classTrack.classTrackStartDay = worldDay;

  setPlayerState(dead, state);
}

export function teleportToRespawn(player) {
  const state = getPlayerState(player);

  if (!state.settings.allowTeleportToRespawn) {
    player.sendMessage("Teleport to Respawn is disabled.");
    return;
  }

  const spawn = player.getSpawnPoint?.() ?? null;
  const target = spawn ?? {
    dimension: player.dimension.id,
    ...world.getDefaultSpawnLocation()
  };

  const dimension = target.dimension
    ? world.getDimension(target.dimension)
    : player.dimension;

  player.teleport(
    {
      x: target.x + 0.5,
      y: target.y,
      z: target.z + 0.5
    },
    {
      dimension
    }
  );
}

export function teleportToLastDeath(player) {
  const state = getPlayerState(player);

  if (!state.settings.allowTeleportToDeath) {
    player.sendMessage("Teleport to Last Death is disabled.");
    return;
  }

  const lastDeath = state.deaths.lastDeathLocation;

  if (!lastDeath) {
    player.sendMessage("No last death location has been recorded.");
    return;
  }

  const dimension = world.getDimension(lastDeath.dimension);

  player.teleport(
    {
      x: lastDeath.x + 0.5,
      y: lastDeath.y + 1,
      z: lastDeath.z + 0.5
    },
    {
      dimension
    }
  );
}