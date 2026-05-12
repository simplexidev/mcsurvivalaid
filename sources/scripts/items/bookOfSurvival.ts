import { system } from "@minecraft/server";
import { ADDON } from "../constants.js";
import { showBookOfSurvivalMenu } from "../ui/bookOfSurvivalMenu.js";

export function registerBookOfSurvivalComponent(event) {
  event.itemComponentRegistry.registerCustomComponent(ADDON.components.bookOfSurvival, {
    onUse(args) {
      const player = args.source;

      if (!player) {
        return;
      }

      system.run(() => {
        showBookOfSurvivalMenu(player);
      });
    },
  });
}
