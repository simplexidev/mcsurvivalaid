"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeShow = safeShow;
const logger_js_1 = require("../logging/logger.js");
async function safeShow(form, player, scope, flow) {
    try {
        return await form.show(player);
    }
    catch (error) {
        logger_js_1.logger.error(scope, "Form show failed", { playerId: player?.id, flow, error: String(error) });
        return { canceled: true, selection: undefined, formValues: undefined, error: String(error) };
    }
}
