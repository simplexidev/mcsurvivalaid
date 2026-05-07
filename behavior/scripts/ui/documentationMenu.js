import { ActionFormData } from "@minecraft/server-ui";

export async function showDocumentationMenu(player) {
  const form = new ActionFormData()
    .title("Survival Aid Documentation")
    .body(
      "Survival Aid rewards players for surviving consecutive days, completing world quests, and using the Survival Chest. " +
      "Use the Book of Survival to access settings, teleport options, item requests, and structure location tools."
    )
    .button("Close");

  await form.show(player);
}