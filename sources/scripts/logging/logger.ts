import { world } from "@minecraft/server";

const TAG = "Survival Aid";

const LOG_LEVELS = Object.freeze({
  trace: 10,
  info: 20,
  warn: 30,
  error: 40,
});

const DEFAULT_LEVEL = "info";

const PROPERTIES = Object.freeze({
  logLevel: "survivalaid:logLevel",
  traceSampleRate: "survivalaid:traceSampleRate",
  traceMinIntervalTicks: "survivalaid:traceMinIntervalTicks",
});

const DEFAULT_TRACE_SAMPLE_RATE = 20;
const DEFAULT_TRACE_MIN_INTERVAL_TICKS = 40;

let cachedLevel = DEFAULT_LEVEL;
let cachedTraceSampleRate = DEFAULT_TRACE_SAMPLE_RATE;
let cachedTraceMinInterval = DEFAULT_TRACE_MIN_INTERVAL_TICKS;
let warnedDynamicPropertiesUnavailable = false;

const traceLastByKey = new Map();

function getDynamicProperty(name, fallback) {
  try {
    const value = world.getDynamicProperty(name);
    return value ?? fallback;
  } catch (error) {
    warnDynamicPropertiesUnavailable(error);
    return fallback;
  }
}

function setDynamicProperty(name, value) {
  try {
    world.setDynamicProperty(name, value);
    return true;
  } catch (error) {
    warnDynamicPropertiesUnavailable(error);
    return false;
  }
}

function warnDynamicPropertiesUnavailable(error) {
  if (warnedDynamicPropertiesUnavailable) return;

  warnedDynamicPropertiesUnavailable = true;

  console.warn(
    formatLine("warn", "logger", "Dynamic properties unavailable yet; using cached/default logger configuration.", {
      error: String(error),
    })
  );
}

function getConfiguredLevel() {
  const raw = getDynamicProperty(PROPERTIES.logLevel, cachedLevel);

  if (typeof raw === "string" && isValidLevel(raw)) {
    cachedLevel = raw;
    return raw;
  }

  return isValidLevel(cachedLevel) ? cachedLevel : DEFAULT_LEVEL;
}

function getTraceSampleRate() {
  const raw = getDynamicProperty(PROPERTIES.traceSampleRate, cachedTraceSampleRate);
  const value = Math.max(1, Number(raw) || DEFAULT_TRACE_SAMPLE_RATE);

  cachedTraceSampleRate = value;
  return value;
}

function getTraceMinInterval() {
  const raw = getDynamicProperty(PROPERTIES.traceMinIntervalTicks, cachedTraceMinInterval);
  const value = Math.max(0, Number(raw) || DEFAULT_TRACE_MIN_INTERVAL_TICKS);

  cachedTraceMinInterval = value;
  return value;
}

function isValidLevel(level) {
  return LOG_LEVELS[level] !== undefined;
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[getConfiguredLevel()];
}

function shouldEmitTrace(scope, message) {
  const tick = Number(world.getAbsoluteTime?.() ?? 0);

  if (tick % getTraceSampleRate() !== 0) {
    return false;
  }

  const key = `${scope}:${message}`;
  const lastTick = traceLastByKey.get(key);

  if (lastTick !== undefined && tick - lastTick < getTraceMinInterval()) {
    return false;
  }

  traceLastByKey.set(key, tick);
  return true;
}

function emit(level, scope, message, context) {
  if (!shouldLog(level)) return;
  if (level === "trace" && !shouldEmitTrace(scope, message)) return;

  const line = formatLine(level, scope, message, context);

  switch (level) {
    case "error":
      if (typeof console.error === "function") {
        console.error(line);
      } else {
        console.warn(line);
      }
      break;

    case "warn":
      console.warn(line);
      break;

    default:
      console.log(line);
      break;
  }
}

function formatLine(level, scope, message, context) {
  const prefix = `[${TAG}][${level.toUpperCase()}][${scope}] ${message}`;
  return context === undefined ? prefix : `${prefix} | ${safeJson(context)}`;
}

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return '{"error":"context_serialization_failed"}';
  }
}

export const logger = {
  trace(scope, message, context) {
    emit("trace", scope, message, context);
  },

  info(scope, message, context) {
    emit("info", scope, message, context);
  },

  warn(scope, message, context) {
    emit("warn", scope, message, context);
  },

  error(scope, message, context) {
    emit("error", scope, message, context);
  },

  setLogLevel(level) {
    if (!isValidLevel(level)) return false;

    cachedLevel = level;

    if (!setDynamicProperty(PROPERTIES.logLevel, level)) {
      emit("warn", "logger", "Failed to persist log level; using cached level only.", { level });
    }

    return true;
  },

  getLogLevel() {
    return getConfiguredLevel();
  },

  setTraceSampleRate(rate) {
    const value = Math.max(1, Number(rate) || DEFAULT_TRACE_SAMPLE_RATE);
    cachedTraceSampleRate = value;

    if (!setDynamicProperty(PROPERTIES.traceSampleRate, value)) {
      emit("warn", "logger", "Failed to persist trace sample rate; using cached value only.", { value });
    }

    return value;
  },

  setTraceMinIntervalTicks(ticks) {
    const value = Math.max(0, Number(ticks) || DEFAULT_TRACE_MIN_INTERVAL_TICKS);
    cachedTraceMinInterval = value;

    if (!setDynamicProperty(PROPERTIES.traceMinIntervalTicks, value)) {
      emit("warn", "logger", "Failed to persist trace minimum interval; using cached value only.", { value });
    }

    return value;
  },
};
