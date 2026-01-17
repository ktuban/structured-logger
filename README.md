
---

# **StructuredLogger**

A fast, developer‑friendly, production‑ready structured logger for Node.js with:

- JSON logs in production  
- Pretty console logs in development  
- Optional request‑ID correlation  
- Deep error serialization  
- Redaction support  
- File or console transports  
- Framework‑agnostic core + optional Express adapter  
- Fully typed TypeScript API  

Perfect for modern backend services, microservices, and API gateways.

---

## **Features**

- Environment‑aware formatting (text in dev, JSON in prod)  
- Optional request‑ID correlation (ALS or manual)  
- Deep error serialization with `cause` support  
- Redaction for sensitive keys  
- Console or file logging  
- Typed, documented API  
- Framework‑agnostic core  
- Optional Express middleware  

---

## **Installation**

```bash
npm install @ktuban/structured-logger
```

---

## **Recommended Usage Pattern**

Create one shared logger instance across your app:

```ts
// logger.ts
import { StructuredLogger } from "@ktuban/structured-logger";

export const logger = StructuredLogger.getInstance({
  level: process.env["LOG_LEVEL"] as any,
  format: process.env["NODE_ENV"] === "development" ? "text" : "json",
  filePath: process.env["LOG_FILE"],
});
```

Use it anywhere:

```ts
import { logger } from "./logger";

logger.info("User created");
logger.error("Something failed", { error });
```

---

## **Public API**

### `StructuredLogger.getInstance(options?)`

Creates or returns the singleton logger.

Options include:

- `serviceName`  
- `level` (`error` | `warn` | `info` | `http` | `debug`)  
- `format` (`json` | `text`)  
- `filePath`  
- `redactKeys`  
- `includeStackTraces`  

---

### **LoggerContract (shared interface)**

```ts
/**
 * LoggerContract
 *
 * A minimal, framework‑agnostic logging contract shared across the ecosystem.
 * Defines the common logging methods (`debug`, `info`, `warn`, `error`)
 * that libraries can depend on without coupling to a specific implementation.
 *
 * - If you use @ktuban/structured-logger, this interface is already satisfied.
 * - If you use another logger (console, pino, winston, bunyan), you can provide
 *   an adapter that implements these methods.
 */
export interface LoggerContract {
  debug?: (message: string, meta?: unknown) => void;
  info?: (message: string, meta?: unknown) => void;
  warn?: (message: string, meta?: unknown) => void;
  error?: (message: string, meta?: unknown) => void;
}
```

Import it directly:

```ts
import type { LoggerContract } from "@ktuban/structured-logger";

function doSomething(logger: LoggerContract) {
  logger.info?.("Running task");
}
```

---

## **Express Integration**

```ts
import { loggingMiddleware } from "@ktuban/structured-logger/express";
import { logger } from "./logger";

app.use(loggingMiddleware(logger));
```

---

## **Why StructuredLogger?**

- Zero‑config developer experience  
- Production‑ready JSON logs  
- Optional request correlation  
- Safer error handling  
- Redaction built‑in  
- Typed, documented, extensible  
- Shared `LoggerContract` for ecosystem consistency  

---

## **License**

MIT

---

👉 With this update, your README now documents the **shared `LoggerContract` interface** so other libraries (like `safe-json-loader`) can import it directly, keeping your ecosystem consistent and reducing duplication.