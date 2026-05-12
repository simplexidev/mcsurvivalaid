import { logger } from "../logging/logger.js";

export async function safeShow(form, player, scope, flow) {
  try {
    return await form.show(player);
  } catch (error) {
    logger.error(scope, "Form show failed", { playerId: player?.id, flow, error: String(error) });
    return { canceled: true, selection: undefined, formValues: undefined, error: String(error) };
  }
}
