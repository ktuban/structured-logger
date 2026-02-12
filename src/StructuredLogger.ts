import { AsyncLocalStorage } from "node:async_hooks";
import { createWriteStream } from "node:fs";
import stringify from "safe-stable-stringify";

export type LogLevel = "error" | "warn" | "info" | "http" | "debug";

export interface BaseLogMeta {
  [key: string]: unknown;
}

export interface HTTPLogMeta extends BaseLogMeta {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  requestId?: string;
  statusMessage?: string;
  ip?: string;
  userAgent?: string;
  contentLength?: string;
  route?: string;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export interface LoggerOptions {
  serviceName?: string;
  level?: LogLevel;
  format?: "json" | "text";
  includeStackTraces?: boolean;
  redactKeys?: (string | RegExp)[];
  filePath?: string; // optional file logging
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  meta: BaseLogMeta | HTTPLogMeta;
  requestId?: string;
}

const COLORS = {
  error: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[36m",
  debug: "\x1b[35m",
  http: "\x1b[32m",
};

const RESET = "\x1b[0m";

export class StructuredLogger {
  private static instance: StructuredLogger;

  private als = new AsyncLocalStorage<{ requestId?: string }>();

  private levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };

  private options: Required<LoggerOptions>;
  private stream: NodeJS.WritableStream;

  private constructor(options: LoggerOptions = {}) {
    const isProd = process.env["NODE_ENV"] === "production";

    this.options = {
      serviceName: options.serviceName ?? process.env["SERVICE_NAME"] ?? "app",
      level: options.level ?? (isProd ? "info" : "debug"),
      format: options.format ?? (isProd ? "json" : "text"),
      includeStackTraces: options.includeStackTraces ?? !isProd,
      redactKeys: options.redactKeys ?? [],
      filePath: options.filePath ?? "",
    };

    this.stream = this.options.filePath
      ? createWriteStream(this.options.filePath, { flags: "a" })
      : process.stdout;
  }

  static getInstance(options?: LoggerOptions) {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger(options);
    }
    return StructuredLogger.instance;
  }

  // ───────────────────────────────────────────────────────────────
  // ALS Context (optional)
  // ───────────────────────────────────────────────────────────────

  runWithContext(requestId: string | undefined, fn: () => void) {
    this.als.run({ requestId }, fn);
  }

  private getRequestId(): string | undefined {
    return this.als.getStore()?.requestId;
  }

  // ───────────────────────────────────────────────────────────────
  // Meta Normalization + Error Serialization
  // ───────────────────────────────────────────────────────────────

  private serializeError(err: Error): BaseLogMeta {
    return {
      name: err.name,
      message: err.message,
      stack: this.options.includeStackTraces ? err.stack : undefined,
      cause: err.cause instanceof Error ? this.serializeError(err.cause) : err.cause,
    };
  }

  private normalizeMeta(meta: unknown): BaseLogMeta {
    if (!meta) return {};

    if (meta instanceof Error) return this.serializeError(meta);

    if (Array.isArray(meta)) {
      // Represent arrays as a single field to avoid weird shapes
      return { items: meta.map((v) => this.normalizeMeta(v)) };
    }

    if (typeof meta === "object") {
      const out: BaseLogMeta = {};
      for (const [key, value] of Object.entries(meta)) {
        out[key] = value instanceof Error ? this.serializeError(value) : value;
      }
      return out;
    }

    return { value: meta };
  }

  private redact(meta: BaseLogMeta): BaseLogMeta {
    const clone: BaseLogMeta = { ...meta };

    for (const key of Object.keys(clone)) {
      for (const rule of this.options.redactKeys) {
        if (typeof rule === "string" && key === rule) {
          clone[key] = "[REDACTED]";
        } else if (rule instanceof RegExp && rule.test(key)) {
          clone[key] = "[REDACTED]";
        }
      }
    }

    return clone;
  }

  // ───────────────────────────────────────────────────────────────
  // Formatting
  // ───────────────────────────────────────────────────────────────

  private format(entry: LogEntry): string {
    if (this.options.format === "json") {
      return stringify(entry);
    }

    const color = COLORS[entry.level];
    const ts = entry.timestamp.replace("T", " ").substring(0, 19);
    const lvl = entry.level.toUpperCase().padEnd(5);
    const rid = entry.requestId ? `[${entry.requestId}]` : "";
    const meta = Object.keys(entry.meta).length ? ` ${stringify(entry.meta)}` : "";

    return `${ts} ${color}${lvl}${RESET} ${rid} ${entry.message}${meta}`;
  }

  // ───────────────────────────────────────────────────────────────
  // Core Write
  // ───────────────────────────────────────────────────────────────

  private write(level: LogLevel, message: string, meta: BaseLogMeta | HTTPLogMeta) {
    if (this.levels[level] > this.levels[this.options.level]) return;

    const normalized = this.redact(this.normalizeMeta(meta));

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.options.serviceName,
      environment: process.env["NODE_ENV"] ?? "development",
      meta: normalized,
      requestId: (meta as HTTPLogMeta).requestId ?? this.getRequestId(),
    };

    this.stream.write(this.format(entry) + "\n");
  }

  // ───────────────────────────────────────────────────────────────
  // Public API (arrow functions to preserve `this`)
  // ───────────────────────────────────────────────────────────────

  error = (msg: string, meta: BaseLogMeta = {}) => {
    this.write("error", msg, meta);
  };

  warn = (msg: string, meta: BaseLogMeta = {}) => {
    this.write("warn", msg, meta);
  };

  info = (msg: string, meta: BaseLogMeta = {}) => {
    this.write("info", msg, meta);
  };

  debug = (msg: string, meta: BaseLogMeta = {}) => {
    this.write("debug", msg, meta);
  };

  http = (msg: string, meta: HTTPLogMeta) => {
    this.write("http", msg, meta);
  };

  // ───────────────────────────────────────────────────────────────
  // Child Logger
  // ───────────────────────────────────────────────────────────────

  child(fixedMeta: BaseLogMeta = {}) {
    return {
      error: (msg: string, meta: BaseLogMeta = {}) =>
        this.error(msg, { ...fixedMeta, ...meta }),
      warn: (msg: string, meta: BaseLogMeta = {}) =>
        this.warn(msg, { ...fixedMeta, ...meta }),
      info: (msg: string, meta: BaseLogMeta = {}) =>
        this.info(msg, { ...fixedMeta, ...meta }),
      debug: (msg: string, meta: BaseLogMeta = {}) =>
        this.debug(msg, { ...fixedMeta, ...meta }),
    };
  }
}