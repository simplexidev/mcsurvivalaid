"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBookOfSurvivalComponent = registerBookOfSurvivalComponent;
const server_1 = require("@minecraft/server");
const constants_js_1 = require("../constants.js");
const bookOfSurvivalMenu_js_1 = require("../ui/bookOfSurvivalMenu.js");
function registerBookOfSurvivalComponent(event) {
    event.itemComponentRegistry.registerCustomComponent(constants_js_1.ADDON.components.bookOfSurvival, {
        onUse(args) {
            const player = args.source;
            if (!player) {
                return;
            }
            server_1.system.run(() => {
                (0, bookOfSurvivalMenu_js_1.showBookOfSurvivalMenu)(player);
            });
        }
    });
}
