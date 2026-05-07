import { ADDON } from "../constants.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { claimPendingRewards, hasPendingRewards } from "../rewards/rewardService.js";

export function registerSurvivalChestComponent(event) {
  event.blockComponentRegistry.registerCustomComponent(ADDON.components.survivalChest, {
    onPlace(args) {
      const player = args.player;

      if (!player) {
        return;
      }

      const state = getPlayerState(player);

      if (state.chest.placed && state.chest.location) {
        player.sendMessage("You can only have one Survival Chest.");
        return;
      }

      state.chest.placed = true;
      state.chest.location = {
        dimension: args.block.dimension.id,
        x: args.block.location.x,
        y: args.block.location.y,
        z: args.block.location.z
      };

      setPlayerState(player, state);
    },

    onPlayerInteract(args) {
      const player = args.player;

      if (!player) {
        return;
      }

      claimPendingRewards(player);

      tryUpdateChestVisual(args.block, player);
    }
  });
}

function tryUpdateChestVisual(block, player) {
  const state = getPlayerState(player);

  if (!state.settings.chestChangesTexture) {
    return;
  }

  const ready = hasPendingRewards(player);

  try {
    const permutation = block.permutation.withState("simplexidev:has_reward", ready);
    block.setPermutation(permutation);
  } catch {
    // State update failed. Ignore for now.
  }
}