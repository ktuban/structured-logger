
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

- **Environment‑aware formatting**  
  - Development → colorful human‑readable logs  
  - Production → compact JSON logs  
- **Optional request‑ID correlation** (ALS‑powered or manual)  
- **Deep error serialization** with `cause` support  
- **Redaction** for sensitive keys (tokens, passwords, etc.)  
- **Console or file logging**  
- **Typed, documented API**  
- **Framework‑agnostic**  
- Optional **Express middleware** for HTTP lifecycle logging  

---

## **Installation**

```bash
npm install @ktuban/structured-logger
```

or

```bash
yarn add @ktuban/structured-logger
```

---

## **Recommended Usage Pattern (Best Practice)**

Most applications should use **one shared logger instance** across the entire codebase.  
This ensures:

- consistent configuration  
- correct request‑ID correlation  
- predictable log levels  
- a single transport (stdout or file)  
- no duplicated streams or race conditions  

### **logger.ts**

```ts
import { StructuredLogger } from "@ktuban/structured-logger";

export const logger = StructuredLogger.getInstance({
  level: process.env.LOG_LEVEL as any,
  format: process.env.LOG_FORMAT as any,
  filePath: process.env.LOG_FILE,
});
```

### **Use it anywhere**

```ts
import { logger } from "./logger";

logger.info("User created");
logger.error("Something failed", { error });
```

This pattern mirrors how production loggers like **pino**, **winston**, and **bunyan** are used, and it guarantees consistent behavior across your entire application.

---

## **Quick Start**

```ts
import { logger } from "./logger";

logger.info("Server started");
logger.error("Something went wrong", { error: new Error("Boom") });
```

---

## **Environment‑Aware Defaults**

| Environment | Format | Level |
|------------|--------|--------|
| `development` | Pretty text | `debug` |
| `production` | JSON | `info` |

Override via env:

```bash
LOG_LEVEL=debug
LOG_FORMAT=json
```

Or via code:

```ts
StructuredLogger.getInstance({
  level: "debug",
  format: "json"
});
```

---

## **Logging Examples**

### **Info**

```ts
logger.info("User logged in", { userId: 42 });
```

### **Error with deep serialization**

```ts
logger.error("Payment failed", {
  error: new Error("Stripe error", { cause: new Error("Timeout") })
});
```

### **Debug**

```ts
logger.debug("Cache miss", { key: "user:42" });
```

---

## **HTTP Logging (Optional)**

```ts
logger.http("Request completed", {
  method: "GET",
  url: "/users",
  statusCode: 200,
  duration: 32,
  requestId: "abc-123"
});
```

---

## **Redaction**

```ts
const logger = StructuredLogger.getInstance({
  redactKeys: ["password", /token/i]
});

logger.info("User update", {
  password: "secret",
  accessToken: "123"
});
```

Output:

```json
{
  "password": "[REDACTED]",
  "accessToken": "[REDACTED]"
}
```

---

## **File Logging**

```ts
StructuredLogger.getInstance({
  filePath: "./logs/app.log"
});
```

Writes logs to the file instead of stdout.

---

## **Child Loggers**

```ts
const dbLogger = logger.child({ component: "database" });

dbLogger.info("Connected");
dbLogger.error("Query failed", { sql: "SELECT * FROM users" });
```

---

## **Optional: Express Integration**

### **1. Request‑ID Middleware**

```ts
import { v4 as uuid } from "uuid";

export function requestIdMiddleware(req, res, next) {
  const id = req.headers["x-request-id"] || uuid();
  req.requestId = id;
  res.locals.requestId = id;
  next();
}
```

### **2. Logging Middleware**

```ts
import { loggingMiddleware } from "@ktuban/structured-logger/express";

app.use(requestIdMiddleware);
app.use(loggingMiddleware());
```

Automatically logs:

- Request start  
- Request completion  
- Duration  
- Status code  
- IP, user agent  
- Request ID  

---

## **API Reference**

### **`StructuredLogger.getInstance(options?)`**

Creates or returns the singleton logger.

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `serviceName` | string | Name of your service |
| `level` | LogLevel | `error` \| `warn` \| `info` \| `http` \| `debug` |
| `format` | `"json"` \| `"text"` | Output format |
| `includeStackTraces` | boolean | Include stack traces in errors |
| `redactKeys` | (string \| RegExp)[] | Keys to mask |
| `filePath` | string | Write logs to file |

---

### **Logging Methods**

| Method | Description |
|--------|-------------|
| `logger.error(msg, meta?)` | Error logs |
| `logger.warn(msg, meta?)` | Warning logs |
| `logger.info(msg, meta?)` | Info logs |
| `logger.debug(msg, meta?)` | Debug logs |
| `logger.http(msg, meta)` | HTTP logs |

---

### **Child Logger**

```ts
const child = logger.child({ component: "worker" });
child.info("Started");
```

---

## **Request Context (Optional)**

If you want ALS‑based correlation:

```ts
logger.runWithContext(requestId, () => {
  logger.info("Inside request context");
});
```

---

## **Why StructuredLogger?**

- Zero‑config developer experience  
- Production‑ready JSON logs  
- Optional request correlation  
- Safer error handling  
- Redaction built‑in  
- Typed, documented, and extensible  
- Works with any framework  

---

## **License**

MIT

---

