"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextClassRewardDay = getNextClassRewardDay;
exports.getEarnedClassRewardDays = getEarnedClassRewardDays;
const constants_js_1 = require("../constants.js");
function getNextClassRewardDay(classTrackDays, claimedDays, pendingDays) {
    for (const day of constants_js_1.CLASS_REWARD_DAYS) {
        if (day > classTrackDays) {
            return day;
        }
        if (!claimedDays.includes(day) && !pendingDays.includes(day)) {
            return day;
        }
    }
    if (classTrackDays < constants_js_1.RECURRING_REWARD_START_DAY) {
        return constants_js_1.RECURRING_REWARD_START_DAY;
    }
    const offset = classTrackDays - constants_js_1.RECURRING_REWARD_START_DAY;
    const intervalsPassed = Math.floor(offset / constants_js_1.RECURRING_REWARD_INTERVAL);
    return constants_js_1.RECURRING_REWARD_START_DAY + ((intervalsPassed + 1) * constants_js_1.RECURRING_REWARD_INTERVAL);
}
function getEarnedClassRewardDays(classTrackDays, claimedDays, pendingDays) {
    const earned = [];
    for (const day of constants_js_1.CLASS_REWARD_DAYS) {
        if (classTrackDays >= day && !claimedDays.includes(day) && !pendingDays.includes(day)) {
            earned.push(day);
        }
    }
    if (classTrackDays >= constants_js_1.RECURRING_REWARD_START_DAY) {
        for (let day = constants_js_1.RECURRING_REWARD_START_DAY; day <= classTrackDays; day += constants_js_1.RECURRING_REWARD_INTERVAL) {
            if (!claimedDays.includes(day) && !pendingDays.includes(day)) {
                earned.push(day);
            }
        }
    }
    return earned;
}
