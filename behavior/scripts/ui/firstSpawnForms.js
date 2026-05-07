import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { ItemStack } from "@minecraft/server";
import { ADDON } from "../constants.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { getClassList } from "../classes/classDefinitions.js";
import { setInitialClass } from "../classes/classService.js";

const activeInitialPrompts = new Set();

export async function handleInitialSpawn(player) {
  if (activeInitialPrompts.has(player.id)) return;

  const state = getPlayerState(player);
  if (state.hasSeenInitialPrompt) return;

  activeInitialPrompts.add(player.id);

  const enableForm = new MessageFormData().title("Survival Aid").body("Enable Survival Aid rewards and utilities?").button1("Enable").button2("Disable");
  const enableResult = await enableForm.show(player);
  if (enableResult.canceled) {
    activeInitialPrompts.delete(player.id);
    return;
  }

  if (enableResult.selection !== 0) {
    state.hasSeenInitialPrompt = true;
    state.enabled = false;
    setPlayerState(player, state);
    player.sendMessage("Survival Aid disabled for your player profile.");
    activeInitialPrompts.delete(player.id);
    return;
  }

  await showClassSelection(player);
  activeInitialPrompts.delete(player.id);
}


async function showClassSelection(player) {
  const classes = getClassList();
  while (true) {
    const form = new ActionFormData().title("Choose Your Class").body("Pick your first Survival Aid class.");
    for (const c of classes) form.button(`${c.name}\n${c.description}`);
    const result = await form.show(player);
    if (!result.canceled && result.selection !== undefined) {
      const selectedClass = classes[result.selection];
      setInitialClass(player, selectedClass.id);
      giveStarterItems(player);
      player.sendMessage(`Survival Aid enabled. Class selected: ${selectedClass.name}.`);
      return;
    }
    const retry = await new MessageFormData().title("Class Selection Required").body("You must pick a class to enable Survival Aid now. Continue selecting?").button1("Continue").button2("Disable Survival Aid").show(player);
    if (retry.canceled || retry.selection !== 0) {
      const state = getPlayerState(player);
      state.hasSeenInitialPrompt = true;
      state.enabled = false;
      setPlayerState(player, state);
      player.sendMessage("Survival Aid disabled for your player profile.");
      return;
    }
  }
}

export function giveStarterItems(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return;
  ensureOneItem(inventory, ADDON.blocks.survivalChest);
  ensureOneItem(inventory, ADDON.items.bookOfSurvival);
}

function ensureOneItem(container, itemId) {
  if (countItem(container, itemId) > 0) return;
  container.addItem(new ItemStack(itemId, 1));
}

function countItem(container, itemId) {
  let total = 0;
  for (let i = 0; i < container.size; i++) {
    const slot = container.getItem(i);
    if (slot?.typeId === itemId) total += slot.amount;
  }
  return total;
}
