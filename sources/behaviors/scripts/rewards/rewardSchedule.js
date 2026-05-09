import {
  CLASS_REWARD_DAYS,
  RECURRING_REWARD_START_DAY,
  RECURRING_REWARD_INTERVAL
} from "../constants.js";

export function getNextClassRewardDay(classTrackDays, claimedDays, pendingDays) {
  for (const day of CLASS_REWARD_DAYS) {
    if (day > classTrackDays) {
      return day;
    }

    if (!claimedDays.includes(day) && !pendingDays.includes(day)) {
      return day;
    }
  }

  if (classTrackDays < RECURRING_REWARD_START_DAY) {
    return RECURRING_REWARD_START_DAY;
  }

  const offset = classTrackDays - RECURRING_REWARD_START_DAY;
  const intervalsPassed = Math.floor(offset / RECURRING_REWARD_INTERVAL);
  return RECURRING_REWARD_START_DAY + ((intervalsPassed + 1) * RECURRING_REWARD_INTERVAL);
}

export function getEarnedClassRewardDays(classTrackDays, claimedDays, pendingDays) {
  const earned = [];

  for (const day of CLASS_REWARD_DAYS) {
    if (classTrackDays >= day && !claimedDays.includes(day) && !pendingDays.includes(day)) {
      earned.push(day);
    }
  }

  if (classTrackDays >= RECURRING_REWARD_START_DAY) {
    for (let day = RECURRING_REWARD_START_DAY; day <= classTrackDays; day += RECURRING_REWARD_INTERVAL) {
      if (!claimedDays.includes(day) && !pendingDays.includes(day)) {
        earned.push(day);
      }
    }
  }

  return earned;
}