import { ItemStack, world } from "@minecraft/server";
import { ADDON } from "../constants.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { claimPendingRewards, hasPendingRewards } from "../rewards/rewardService.js";

export function registerSurvivalChestComponent(event) {
  event.blockComponentRegistry.registerCustomComponent(ADDON.components.survivalChest, {
    onPlace(args) {
      const player = args.player;
      if (!player) return;
      const state = getPlayerState(player);
      if (state.chest.placed && state.chest.location) {
        player.sendMessage("You can only have one Survival Chest.");
        // Best effort: remove duplicate placement and refund item.
        try { args.block.setType("minecraft:air"); } catch {}
        const inv = player.getComponent("minecraft:inventory")?.container;
        if (inv) inv.addItem(new ItemStack(ADDON.blocks.survivalChest, 1));
        return;
      }
      state.chest.placed = true;
      state.chest.location = { ownerId: player.id, dimension: args.block.dimension.id, x: args.block.location.x, y: args.block.location.y, z: args.block.location.z };
      setPlayerState(player, state);
      syncChestVisualForPlayer(player);
    },
    onPlayerInteract(args) {
      const player = args.player;
      if (!player) return;
      const state = getPlayerState(player);
      if (!state.chest.location) return;
      const b = args.block.location;
      const own = state.chest.location;
      if (own.dimension !== args.block.dimension.id || own.x !== b.x || own.y !== b.y || own.z !== b.z) return player.sendMessage("This is not your registered Survival Chest.");
      claimPendingRewards(player);
      tryUpdateChestVisual(args.block, player);
    },
    onPlayerDestroy(args) {
      const player = args.player;
      if (!player) return;
      const state = getPlayerState(player);
      if (!state.chest.location) return;
      const b = args.block.location;
      const own = state.chest.location;
      if (own.dimension === args.block.dimension.id && own.x === b.x && own.y === b.y && own.z === b.z) {
        state.chest.placed = false;
        state.chest.location = null;
        setPlayerState(player, state);
      }
    }
  });
}

export function syncChestVisualForPlayer(player) {
  const state = getPlayerState(player);
  if (!state.chest.location || !state.settings.chestChangesTexture) return;
  try {
    const dim = world.getDimension(state.chest.location.dimension);
    const block = dim.getBlock({ x: state.chest.location.x, y: state.chest.location.y, z: state.chest.location.z });
    if (!block || block.typeId !== ADDON.blocks.survivalChest) return;
    tryUpdateChestVisual(block, player);
  } catch {}
}

function tryUpdateChestVisual(block, player) {
  const state = getPlayerState(player);
  if (!state.settings.chestChangesTexture) return;
  const ready = hasPendingRewards(player);
  try { block.setPermutation(block.permutation.withState("simplexidev:has_reward", ready)); } catch {}
}
