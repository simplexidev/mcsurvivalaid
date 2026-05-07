import { world } from "@minecraft/server";

const LOG_LEVELS = { trace: 10, info: 20, warn: 30, error: 40 };
const DEFAULT_LEVEL = "info";
const LOG_PROPERTY = "survivalaid:logLevel";

function getConfiguredLevel() {
  const raw = world.getDynamicProperty(LOG_PROPERTY);
  if (typeof raw === "string" && LOG_LEVELS[raw] !== undefined) return raw;
  return DEFAULT_LEVEL;
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[getConfiguredLevel()];
}

function emit(level, scope, message, context) {
  if (!shouldLog(level)) return;
  const prefix = `[Survival Aid][${level.toUpperCase()}][${scope}] ${message}`;
  const contextText = context ? ` | ${safeJson(context)}` : "";
  const line = `${prefix}${contextText}`;
  if (level === "warn" || level === "error") {
    console.warn(line);
    return;
  }
  console.log(line);
}

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "{\"error\":\"context_serialization_failed\"}";
  }
}

export const logger = {
  trace: (scope, message, context) => emit("trace", scope, message, context),
  info: (scope, message, context) => emit("info", scope, message, context),
  warn: (scope, message, context) => emit("warn", scope, message, context),
  error: (scope, message, context) => emit("error", scope, message, context),
  setLogLevel(level) {
    if (LOG_LEVELS[level] === undefined) return false;
    world.setDynamicProperty(LOG_PROPERTY, level);
    return true;
  },
  getLogLevel() {
    return getConfiguredLevel();
  }
};
