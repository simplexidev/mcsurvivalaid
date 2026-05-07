import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { system } from "@minecraft/server";
import { getPlayerState, setPlayerState } from "../state/playerState.js";

const REQUESTABLE_ITEMS = ["coal","raw_iron","raw_copper","raw_gold","redstone","lapis_lazuli","oak_log","spruce_log","birch_log","cobblestone","sand","gravel","clay_ball","wheat_seeds","sugar_cane"];

export async function showItemRequestsMenu(player) {
  const root = new ActionFormData().title("Item Requests").button("Create Request").button("View Active Requests");
  const rootResult = await root.show(player);
  if (rootResult.canceled || rootResult.selection === undefined) return;
  if (rootResult.selection === 1) return showActiveRequests(player);

  const form = new ActionFormData().title("Item Requests").body("Select an item to request.");
  for (const item of REQUESTABLE_ITEMS) form.button(item);
  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;
  const itemId = `minecraft:${REQUESTABLE_ITEMS[result.selection]}`;
  const qtyForm = new ModalFormData().title("Request Quantity").slider("Quantity", 1, 64, 1, 1);
  const qtyResult = await qtyForm.show(player);
  if (qtyResult.canceled || !qtyResult.formValues) return;
  queueItemRequest(player, itemId, Math.floor(qtyResult.formValues[0]));
}

function showActiveRequests(player) {
  const state = getPlayerState(player);
  const active = state.requests.active.filter(r => !r.claimed);
  if (active.length === 0) return player.sendMessage("No active item requests.");
  const lines = active.map((r, i) => `${i + 1}. ${r.itemId} x${r.quantity} (${Math.max(0, Math.ceil((r.readyAtTick - system.currentTick) / 20))}s)`);
  player.sendMessage(`Active Requests: ${lines.join(" | ")}`);
}

export function queueItemRequest(player, itemId, quantity) {
  const state = getPlayerState(player);
  const duration = Math.ceil(quantity * 1.25) * 20;
  state.requests.active.push({ itemId, quantity, requestedAtTick: system.currentTick, readyAtTick: system.currentTick + duration, claimed: false });
  setPlayerState(player, state);
  player.sendMessage(`Requested ${quantity}x ${itemId}. Ready in ${Math.ceil(duration / 20)}s.`);
}

export function collectReadyItemRequests(state) {
  const ready = [];
  for (const req of state.requests.active) {
    if (!req.claimed && req.readyAtTick <= system.currentTick) {
      ready.push(req);
      req.claimed = true;
    }
  }
  return ready;
}
