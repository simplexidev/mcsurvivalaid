import { Player } from "@minecraft/server";
import { ActionFormData, ActionFormResponse, MessageFormData, MessageFormResponse, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { SDError, SDResult } from "./Common";


export interface ActionFormButton<TValue = string> {
  readonly text: string;

  readonly iconPath?: string;

  readonly value: TValue;
}

export interface ActionMenuOptions<TValue = string> {
  readonly title: string;

  readonly body?: string;

  readonly buttons: readonly ActionFormButton<TValue>[];
}

export interface ActionMenuSelection<TValue = string> {
  readonly selectedIndex: number;

  readonly selectedButton: ActionFormButton<TValue>;

  readonly value: TValue;
}

export interface ConfirmationOptions {
  readonly title: string;

  readonly body: string;

  readonly yesText?: string;

  readonly noText?: string;
}

export interface TextPromptOptions {
  readonly title: string;

  readonly label: string;

  readonly placeholder?: string;

  readonly defaultValue?: string;

  readonly submitButtonText?: string;
}

export interface FormService {
  showActionMenu<TValue>(
    player: Player,
    options: ActionMenuOptions<TValue>,
  ): Promise<SDResult<ActionMenuSelection<TValue> | undefined>>;

  confirm(
    player: Player,
    options: ConfirmationOptions,
  ): Promise<SDResult<boolean | undefined>>;

  promptText(
    player: Player,
    options: TextPromptOptions,
  ): Promise<SDResult<string | undefined>>;
}

export class MinecraftFormService implements FormService {
  public async showActionMenu<TValue>(
    player: Player,
    options: ActionMenuOptions<TValue>,
  ): Promise<SDResult<ActionMenuSelection<TValue> | undefined>> {
    try {
      const form = new ActionFormData().title(options.title);

      if (options.body !== undefined) {
        form.body(options.body);
      }

      for (const button of options.buttons) {
        form.button(button.text, button.iconPath);
      }

      const response: ActionFormResponse = await form.show(player);

      if (response.canceled || response.selection === undefined) {
        return SDResult.ok(undefined);
      }

      const selectedButton = options.buttons[response.selection];

      if (selectedButton === undefined) {
        return SDResult.fail(
          new SDError(
            "form.invalid_selection",
            "Action form returned invalid selection.",
            {
              selection: response.selection,
            },
          ),
        );
      }

      return SDResult.ok({
        selectedIndex: response.selection,
        selectedButton,
        value: selectedButton.value,
      });
    } catch (error) {
      return SDResult.fail(
        SDError.exception("form.action_failed", error, options),
      );
    }
  }

  public async confirm(
    player: Player,
    options: ConfirmationOptions,
  ): Promise<SDResult<boolean | undefined>> {
    try {
      const form = new MessageFormData()
        .title(options.title)
        .body(options.body)
        .button1(options.yesText ?? "Yes")
        .button2(options.noText ?? "No");

      const response: MessageFormResponse = await form.show(player);

      if (response.canceled || response.selection === undefined) {
        return SDResult.ok(undefined);
      }

      return SDResult.ok(response.selection === 0);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("form.confirm_failed", error, options),
      );
    }
  }

  public async promptText(
    player: Player,
    options: TextPromptOptions,
  ): Promise<SDResult<string | undefined>> {
    try {
      const form = new ModalFormData()
        .title(options.title)
        .textField(options.label, options.placeholder ?? "", {
          defaultValue: options.defaultValue ?? "",
        });

      if (options.submitButtonText !== undefined) {
        form.submitButton(options.submitButtonText);
      }

      const response: ModalFormResponse = await form.show(player);

      if (response.canceled || response.formValues === undefined) {
        return SDResult.ok(undefined);
      }

      const value = response.formValues[0];

      return typeof value === "string"
        ? SDResult.ok(value)
        : SDResult.fail(
            new SDError(
              "form.invalid_text_value",
              "Expected text value.",
              response,
            ),
          );
    } catch (error) {
      return SDResult.fail(
        SDError.exception("form.prompt_text_failed", error, options),
      );
    }
  }
}