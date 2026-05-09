import { world } from "@minecraft/server";

const LOG_LEVELS = { trace: 10, info: 20, warn: 30, error: 40 };
const DEFAULT_LEVEL = "info";
const LOG_PROPERTY = "survivalaid:logLevel";
const TRACE_SAMPLE_PROPERTY = "survivalaid:traceSampleRate";
const TRACE_MIN_INTERVAL_PROPERTY = "survivalaid:traceMinIntervalTicks";
let cachedLevel = DEFAULT_LEVEL;
let hasWarnedEarlyExecution = false;
const traceLastByKey = new Map();

function getConfiguredLevel() {
  try {
    const raw = world.getDynamicProperty(LOG_PROPERTY);
    if (typeof raw === "string" && LOG_LEVELS[raw] !== undefined) {
      cachedLevel = raw;
      return raw;
    }
  } catch (error) {
    if (!hasWarnedEarlyExecution) {
      hasWarnedEarlyExecution = true;
      console.warn(`[Survival Aid][WARN][logger] Dynamic properties unavailable yet; using cached/default log level. | ${safeJson({ error: String(error) })}`);
    }
  }
  if (LOG_LEVELS[cachedLevel] !== undefined) return cachedLevel;
  return DEFAULT_LEVEL;
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[getConfiguredLevel()];
}

function emit(level, scope, message, context) {
  if (!shouldLog(level)) return;
  if (level === "trace" && !shouldEmitTrace(scope, message)) return;
  const prefix = `[Survival Aid][${level.toUpperCase()}][${scope}] ${message}`;
  const contextText = context ? ` | ${safeJson(context)}` : "";
  const line = `${prefix}${contextText}`;
  if (level === "warn" || level === "error") {
    console.warn(line);
    return;
  }
  console.log(line);
}
function shouldEmitTrace(scope, message) {
  const tick = Number(world.getAbsoluteTime?.() ?? 0);
  const sampleRate = Math.max(1, Number(world.getDynamicProperty(TRACE_SAMPLE_PROPERTY) ?? 20));
  const minInterval = Math.max(0, Number(world.getDynamicProperty(TRACE_MIN_INTERVAL_PROPERTY) ?? 40));
  if (tick % sampleRate !== 0) return false;
  const key = `${scope}:${message}`;
  const lastTick = traceLastByKey.get(key);
  if (lastTick !== undefined && tick - lastTick < minInterval) return false;
  traceLastByKey.set(key, tick);
  return true;
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
    cachedLevel = level;
    try {
      world.setDynamicProperty(LOG_PROPERTY, level);
    } catch (error) {
      emit("warn", "logger", "Failed to persist log level; using cached level only", { level, error: String(error) });
    }
    return true;
  },
  getLogLevel() {
    return getConfiguredLevel();
  }
};
