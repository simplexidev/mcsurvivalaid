import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { ItemStack } from "@minecraft/server";
import { ADDON } from "../constants.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { getClassList } from "../classes/classDefinitions.js";
import { setInitialClass } from "../classes/classService.js";

export async function handleInitialSpawn(player) {
  const state = getPlayerState(player);

  if (state.enabled || state.hasSeenInitialPrompt) {
    return;
  }

  const enableForm = new MessageFormData()
    .title("Survival Aid")
    .body("Would you like to enable Survival Aid rewards for this world?")
    .button1("Enable")
    .button2("Disable");

  const enableResult = await enableForm.show(player);

  if (enableResult.canceled) {
    return;
  }

  if (enableResult.selection !== 0) {
    state.hasSeenInitialPrompt = true;
    state.enabled = false;
    setPlayerState(player, state);
    return;
  }

  await showClassSelection(player);
}

async function showClassSelection(player) {
  const classes = getClassList();

  const form = new ActionFormData()
    .title("Choose Your Class")
    .body("Pick your first Survival Aid class.");

  for (const classDefinition of classes) {
    form.button(`${classDefinition.name}\n${classDefinition.description}`);
  }

  const result = await form.show(player);

  if (result.canceled || result.selection === undefined) {
    return;
  }

  const selectedClass = classes[result.selection];
  setInitialClass(player, selectedClass.id);
  giveStarterItems(player);

  player.sendMessage(`Survival Aid enabled. Class selected: ${selectedClass.name}.`);
}

function giveStarterItems(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;

  if (!inventory) {
    return;
  }

  inventory.addItem(new ItemStack(ADDON.blocks.survivalChest, 1));
  inventory.addItem(new ItemStack(ADDON.items.bookOfSurvival, 1));
}