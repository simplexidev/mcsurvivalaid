import { world } from "@minecraft/server";

export interface ContextSerializer {
  serialize(value: unknown): string;
}

export class JsonContextSerializer implements ContextSerializer {
  public serialize(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return '{"error":"context_serialization_failed"}';
    }
  }
}

export interface LogContext {
  readonly [key: string]: unknown;
}

export interface LogEntry {
  readonly tag: string;

  readonly level: LogLevel;

  readonly scope: string;

  readonly message: string;

  readonly context?: unknown;
}

export class LogFormatter {
  public constructor(private readonly serializer: ContextSerializer) {}

  public format(entry: LogEntry): string {
    const prefix = `[${entry.tag}][${entry.level.toUpperCase()}][${entry.scope}] ${entry.message}`;

    return entry.context === undefined
      ? prefix
      : `${prefix} | ${this.serializer.serialize(entry.context)}`;
  }
}

export class Logger {
  public constructor(
    public readonly configuration: LoggerConfiguration,
    private readonly tag: string,
    private readonly sink: LogSink,
    private readonly formatter: LogFormatter,
    private readonly traceThrottle: TraceThrottle,
  ) {}

  public trace(scope: string, message: string, context?: unknown): void {
    this.emit(LogLevel.Trace, scope, message, context);
  }

  public info(scope: string, message: string, context?: unknown): void {
    this.emit(LogLevel.Info, scope, message, context);
  }

  public warn(scope: string, message: string, context?: unknown): void {
    this.emit(LogLevel.Warn, scope, message, context);
  }

  public error(scope: string, message: string, context?: unknown): void {
    this.emit(LogLevel.Error, scope, message, context);
  }

  public withScope(scope: string): ScopedLogger {
    return new ScopedLogger(this, scope);
  }

  private emit(
    level: LogLevel,
    scope: string,
    message: string,
    context?: unknown,
  ): void {
    if (!this.configuration.shouldLog(level)) {
      return;
    }

    if (
      level === LogLevel.Trace &&
      !this.traceThrottle.shouldEmit(scope, message)
    ) {
      return;
    }

    const entry: LogEntry = {
      tag: this.tag,
      level,
      scope,
      message,
      context,
    };

    this.sink.write(entry, this.formatter.format(entry));
  }
}

export interface LoggerConfigurationOptions {
  readonly logLevelKey: string;

  readonly traceSampleRateKey: string;

  readonly traceMinimumIntervalTicksKey: string;

  readonly defaultLevel?: LogLevel;

  readonly defaultTraceSampleRate?: number;

  readonly defaultTraceMinimumIntervalTicks?: number;
}

export class LoggerConfiguration {
  private cachedLevel: LogLevel;

  private cachedTraceSampleRate: number;

  private cachedTraceMinimumIntervalTicks: number;

  public constructor(
    private readonly store: LoggerSettingsStore,
    private readonly options: LoggerConfigurationOptions,
  ) {
    this.cachedLevel = options.defaultLevel ?? LogLevel.Info;
    this.cachedTraceSampleRate = options.defaultTraceSampleRate ?? 20;
    this.cachedTraceMinimumIntervalTicks =
      options.defaultTraceMinimumIntervalTicks ?? 40;
  }

  public getLevel(): LogLevel {
    const raw = this.store.getString(
      this.options.logLevelKey,
      this.cachedLevel,
    );

    if (LoggerConfiguration.isValidLevel(raw)) {
      this.cachedLevel = raw;
      return raw;
    }

    return this.cachedLevel;
  }

  public setLevel(level: LogLevel): boolean {
    this.cachedLevel = level;
    return this.store.setString(this.options.logLevelKey, level);
  }

  public getTraceSampleRate(): number {
    const raw = this.store.getNumber(
      this.options.traceSampleRateKey,
      this.cachedTraceSampleRate,
    );
    const value = Math.max(1, raw || this.cachedTraceSampleRate);

    this.cachedTraceSampleRate = value;
    return value;
  }

  public setTraceSampleRate(rate: number): number {
    const value = Math.max(1, Number(rate) || this.cachedTraceSampleRate);

    this.cachedTraceSampleRate = value;
    this.store.setNumber(this.options.traceSampleRateKey, value);

    return value;
  }

  public getTraceMinimumIntervalTicks(): number {
    const raw = this.store.getNumber(
      this.options.traceMinimumIntervalTicksKey,
      this.cachedTraceMinimumIntervalTicks,
    );

    const value = Math.max(0, raw || this.cachedTraceMinimumIntervalTicks);

    this.cachedTraceMinimumIntervalTicks = value;
    return value;
  }

  public setTraceMinimumIntervalTicks(ticks: number): number {
    const value = Math.max(
      0,
      Number(ticks) || this.cachedTraceMinimumIntervalTicks,
    );

    this.cachedTraceMinimumIntervalTicks = value;
    this.store.setNumber(this.options.traceMinimumIntervalTicksKey, value);

    return value;
  }

  public shouldLog(level: LogLevel): boolean {
    return LogLevelPriority[level] >= LogLevelPriority[this.getLevel()];
  }

  public static isValidLevel(value: unknown): value is LogLevel {
    return (
      value === LogLevel.Trace ||
      value === LogLevel.Info ||
      value === LogLevel.Warn ||
      value === LogLevel.Error
    );
  }
}

export class LoggerFactory {
  public static createModuleLogger(moduleTag: string): Logger {
    const serializer = new JsonContextSerializer();

    const store = new DynamicPropertyLoggerSettingsStore(moduleTag, serializer);

    const configuration = new LoggerConfiguration(store, {
      logLevelKey: "simplexidev:core:logger:level",
      traceSampleRateKey: "simplexidev:core:logger:trace_sample_rate",
      traceMinimumIntervalTicksKey:
        "simplexidev:core:logger:trace_min_interval_ticks",
      defaultLevel: LogLevel.Info,
      defaultTraceSampleRate: 20,
      defaultTraceMinimumIntervalTicks: 40,
    });

    const sink = new ConsoleLogSink();
    const formatter = new LogFormatter(serializer);
    const traceThrottle = new TraceThrottle(configuration);

    return new Logger(configuration, moduleTag, sink, formatter, traceThrottle);
  }
}

export interface LoggerSettingsStore {
  getString(key: string, fallback: string): string;

  getNumber(key: string, fallback: number): number;

  setString(key: string, value: string): boolean;

  setNumber(key: string, value: number): boolean;
}

export class DynamicPropertyLoggerSettingsStore implements LoggerSettingsStore {
  private hasWarnedUnavailable = false;

  public constructor(
    private readonly warningTag: string,
    private readonly serializer: ContextSerializer = new JsonContextSerializer(),
  ) {}

  public getString(key: string, fallback: string): string {
    const value = this.getDynamicProperty(key, fallback);
    return typeof value === "string" ? value : fallback;
  }

  public getNumber(key: string, fallback: number): number {
    const value = this.getDynamicProperty(key, fallback);
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  public setString(key: string, value: string): boolean {
    return this.setDynamicProperty(key, value);
  }

  public setNumber(key: string, value: number): boolean {
    return this.setDynamicProperty(key, value);
  }

  private getDynamicProperty(key: string, fallback: unknown): unknown {
    try {
      return world.getDynamicProperty(key) ?? fallback;
    } catch (error) {
      this.warnUnavailable(error);
      return fallback;
    }
  }

  private setDynamicProperty(
    key: string,
    value: string | number | boolean,
  ): boolean {
    try {
      world.setDynamicProperty(key, value);
      return true;
    } catch (error) {
      this.warnUnavailable(error);
      return false;
    }
  }

  private warnUnavailable(error: unknown): void {
    if (this.hasWarnedUnavailable) {
      return;
    }

    this.hasWarnedUnavailable = true;

    const context = this.serializer.serialize({
      error: String(error),
    });

    console.warn(
      `[${this.warningTag}][WARN][logger] Dynamic properties unavailable yet; using cached/default logger configuration. | ${context}`,
    );
  }
}

export enum LogLevel {
  Trace = "trace",

  Info = "info",

  Warn = "warn",

  Error = "error",
}

export const LogLevelPriority: Readonly<Record<LogLevel, number>> =
  Object.freeze({
    [LogLevel.Trace]: 10,
    [LogLevel.Info]: 20,
    [LogLevel.Warn]: 30,
    [LogLevel.Error]: 40,
  });
  
export interface LogSink {
  write(entry: LogEntry, formattedLine: string): void;
}

export class ConsoleLogSink implements LogSink {
  public write(entry: LogEntry, formattedLine: string): void {
    switch (entry.level) {
      case LogLevel.Error:
        if (typeof console.error === "function") {
          console.error(formattedLine);
        } else {
          console.warn(formattedLine);
        }
        break;

      case LogLevel.Warn:
        console.warn(formattedLine);
        break;

      default:
        console.log(formattedLine);
        break;
    }
  }
}

export class ScopedLogger {
  public constructor(
    private readonly logger: Logger,
    private readonly scope: string,
  ) {}

  public trace(message: string, context?: unknown): void {
    this.logger.trace(this.scope, message, context);
  }

  public info(message: string, context?: unknown): void {
    this.logger.info(this.scope, message, context);
  }

  public warn(message: string, context?: unknown): void {
    this.logger.warn(this.scope, message, context);
  }

  public error(message: string, context?: unknown): void {
    this.logger.error(this.scope, message, context);
  }
}

export class TraceThrottle {
  private readonly lastTickByKey = new Map<string, number>();

  public constructor(private readonly configuration: LoggerConfiguration) {}

  public shouldEmit(scope: string, message: string): boolean {
    const tick = Number(world.getAbsoluteTime?.() ?? 0);

    if (tick % this.configuration.getTraceSampleRate() !== 0) {
      return false;
    }

    const key = `${scope}:${message}`;
    const lastTick = this.lastTickByKey.get(key);

    if (
      lastTick !== undefined &&
      tick - lastTick < this.configuration.getTraceMinimumIntervalTicks()
    ) {
      return false;
    }

    this.lastTickByKey.set(key, tick);
    return true;
  }

  public clear(): void {
    this.lastTickByKey.clear();
  }
}