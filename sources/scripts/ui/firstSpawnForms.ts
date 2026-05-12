import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { ItemStack, system } from "@minecraft/server";
import { ADDON } from "../constants.js";
import { getPlayerState, setPlayerState } from "../state/playerState.js";
import { getClassList } from "../classes/classDefinitions.js";
import { setInitialClass } from "../classes/classService.js";
import { logger } from "../logging/logger.js";
import { safeShow } from "./safeShow.js";
import { MinecraftComponentId } from "../types/domain.js";

const activeInitialPrompts = new Set();

export async function handleInitialSpawn(player) {
  logger.trace("firstSpawn", "handleInitialSpawn invoked", { playerId: player.id });
  if (activeInitialPrompts.has(player.id)) { logger.trace("firstSpawn", "Prompt already active", { playerId: player.id }); return; }

  const state = getPlayerState(player);
  if (state.hasSeenInitialPrompt) { logger.trace("firstSpawn", "Initial prompt already seen", { playerId: player.id }); return; }

  activeInitialPrompts.add(player.id);

  const enableForm = new MessageFormData().title("Survival Aid Add-On").body("This world allows for world-based quests, daily rewards, and other helpful survival utilities. Would you like to enable these features?").button1("Enable").button2("Disable");
  const enableResult = await showRequiredMessageForm(player, enableForm, "initial_enable");

  if (enableResult.selection !== 0) {
    state.hasSeenInitialPrompt = true;
    state.enabled = false;
    setPlayerState(player, state);
    player.sendMessage("Survival Aid disabled for your player profile.");
    logger.info("firstSpawn", "Player disabled Survival Aid at prompt", { playerId: player.id });
    activeInitialPrompts.delete(player.id);
    return;
  }

  await showClassSelection(player);
  activeInitialPrompts.delete(player.id);
}

async function showClassSelection(player) {
  const classes = getClassList();
  logger.trace("firstSpawn", "Showing class selection", { playerId: player.id, classCount: classes.length });
  while (true) {
    const form = new ActionFormData().title("Choose Your Class").body("Pick your first Survival Aid class.");
    for (const c of classes) form.button(`${c.name}
${c.description}`);
    const result = await showRequiredActionForm(player, form, "class_selection");
    if (result.selection !== undefined) {
      const selectedClass = classes[result.selection];
      logger.info("firstSpawn", "Initial class selected", { playerId: player.id, classId: selectedClass.id });
      setInitialClass(player, selectedClass.id);
      giveStarterItems(player);
      player.sendMessage(`Survival Aid enabled. Class selected: ${selectedClass.name}.`);
      return;
    }
    logger.warn("firstSpawn", "Class selection returned invalid result", { playerId: player.id, result });
    const retry = await showRequiredMessageForm(player, new MessageFormData().title("Class Selection Required").body("You must pick a class to enable Survival Aid now. Continue selecting?").button1("Continue").button2("Disable Survival Aid"), "class_selection_retry");
    if (retry.canceled || retry.selection !== 0) {
      const state = getPlayerState(player);
      state.hasSeenInitialPrompt = true;
      state.enabled = false;
      setPlayerState(player, state);
      player.sendMessage("Survival Aid disabled for your player profile.");
      logger.info("firstSpawn", "Player exited class prompt and disabled", { playerId: player.id });
      return;
    }
  }
}

async function showRequiredMessageForm(player, form, flow) {
  let attempts = 0;
  while (true) {
    attempts++;
    const result = await safeShow(form, player, "firstSpawn", `required_message_${flow}`);
    if (!result.canceled && result.selection !== undefined) return result;
    if (attempts <= 3 || attempts % 10 === 0) {
      logger.warn("firstSpawn", "Required message form canceled; re-showing", { playerId: player.id, flow, attempts });
    }
    await waitTicks(10);
  }
}

async function showRequiredActionForm(player, form, flow) {
  let attempts = 0;
  while (true) {
    attempts++;
    const result = await safeShow(form, player, "firstSpawn", `required_action_${flow}`);
    if (!result.canceled && result.selection !== undefined) return result;
    if (attempts <= 3 || attempts % 10 === 0) {
      logger.warn("firstSpawn", "Required action form canceled; re-showing", { playerId: player.id, flow, attempts });
    }
    await waitTicks(10);
  }
}

function waitTicks(ticks) {
  return new Promise<void>((resolve) => {
    system.runTimeout(() => resolve(), ticks);
  });
}

export function giveStarterItems(player) {
  const inventory = player.getComponent(MinecraftComponentId.Inventory)?.container;
  if (!inventory) { logger.warn("firstSpawn", "No inventory container for starter items", { playerId: player.id }); return; }
  ensureOneItem(inventory, ADDON.blocks.survivalChest);
  ensureOneItem(inventory, ADDON.items.bookOfSurvival);
}

function ensureOneItem(container, itemId) {
  if (countItem(container, itemId) > 0) { logger.trace("firstSpawn", "Starter item already present", { itemId }); return; }
  try {
    container.addItem(new ItemStack(itemId, 1));
    logger.trace("firstSpawn", "Starter item granted", { itemId });
  } catch (error) {
    logger.error("firstSpawn", "Failed to grant starter item", { itemId, error: String(error) });
  }
}

function countItem(container, itemId) {
  let total = 0;
  for (let i = 0; i < container.size; i++) {
    const slot = container.getItem(i);
    if (slot?.typeId === itemId) total += slot.amount;
  }
  return total;
}
