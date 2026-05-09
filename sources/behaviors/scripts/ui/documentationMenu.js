import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerState } from "../state/playerState.js";
import { safeShow } from "./safeShow.js";

const PAGES = [
  ["What Survival Aid Is", "A Bedrock survival helper with rewards, requests, teleports, and progress tracking."],
  ["Survival Chest", "Claim pending class rewards, quest rewards, and completed item requests from your registered chest."],
  ["Book of Survival", "Main UI entry: structure locator, item requests, teleports, docs, settings."],
  ["Classes & Rewards", "Choose Adventurer/Warrior/Miner/Mage. Earn tier rewards at day milestones and recurring rewards later."],
  ["World Quests", "Quest categories track travel/blocks/combat and queue classless rewards on tier thresholds."],
  ["Item Requests", "Request allowed base resources. Time = ceil(quantity * 1.25) seconds."],
  ["Teleports", "Teleport to respawn/last death with per-player cooldowns and settings toggles."],
  ["Settings", "Toggle HUD sections, chest texture behavior, teleports, and cooldown values."]
];

export async function showDocumentationMenu(player) {
  const state = getPlayerState(player);
  const progress = `\n\nStatus: class=${state.classTrack.currentClass ?? "none"}, pendingClass=${state.classTrack.pendingClassRewardDays.length}, pendingQuest=${state.quests.pendingQuestRewards.length}`;
  let form = new ActionFormData().title("Survival Aid Documentation").body("Select a topic.");
  for (const [name] of PAGES) form.button(name);
  form.button("Quest Progress Snapshot");
  const res = await safeShow(form, player, "documentationMenu", "topic_select");
  if (res.canceled || res.selection === undefined) return;
  if (res.selection === PAGES.length) {
    const q = state.quests;
    const body = `Travel: ${JSON.stringify(q.travel)}\nBlocks Broken: ${JSON.stringify(q.blocksBroken)}\nBlocks Placed: ${JSON.stringify(q.blocksPlaced)}\nCombat: ${JSON.stringify(q.combat)}`;
    await safeShow(new ActionFormData().title("Quest Progress Snapshot").body(body).button("Back"), player, "documentationMenu", "quest_snapshot");
    return;
  }
  const [title, body] = PAGES[res.selection];
  await safeShow(new ActionFormData().title(title).body(body + progress).button("Back"), player, "documentationMenu", "topic_detail");
}
