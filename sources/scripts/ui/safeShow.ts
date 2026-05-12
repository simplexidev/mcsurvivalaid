import type { Player } from "@minecraft/server";
import type { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { logger } from "../logging/logger.js";
import type { ActionFormResult, ModalFormResult, SafeFormError } from "../types/domain.js";

export async function safeShow(
  form: ModalFormData,
  player: Player,
  scope: string,
  flow: string
): Promise<ModalFormResult & SafeFormError>;
export async function safeShow(
  form: ActionFormData | MessageFormData,
  player: Player,
  scope: string,
  flow: string
): Promise<ActionFormResult & SafeFormError>;
export async function safeShow(
  form: ActionFormData | ModalFormData | MessageFormData,
  player: Player,
  scope: string,
  flow: string
): Promise<(ActionFormResult | ModalFormResult) & SafeFormError> {
  try {
    return await form.show(player);
  } catch (error) {
    logger.error(scope, "Form show failed", { playerId: player?.id, flow, error: String(error) });
    return { canceled: true, selection: undefined, formValues: undefined, error: String(error) };
  }
}
