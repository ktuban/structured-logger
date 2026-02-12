# @ktuban/structured-logger

[![npm version](https://img.shields.io/npm/v/@ktuban/structured-logger.svg)](https://www.npmjs.com/package/@ktuban/structured-logger)
[![npm downloads](https://img.shields.io/npm/dm/@ktuban/structured-logger.svg)](https://www.npmjs.com/package/@ktuban/structured-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Support via PayPal](https://img.shields.io/badge/Support-PayPal-blue.svg)](https://paypal.me/KhalilTuban)
[![Ko‑fi](https://img.shields.io/badge/Support-Ko--fi-red.svg)](https://ko-fi.com/ktuban)

Fast, developer-friendly, **production-ready structured logger** for Node.js with JSON output, pretty console logs, request-ID correlation, deep error serialization, field redaction, and optional Express integration.

## ✨ Features

- **Structured Logging** — JSON output for machine parsing, pretty console for development
- **Request Correlation** — Automatic request-ID tracking using AsyncLocalStorage
- **Deep Error Serialization** — Stack traces, cause chains, and error context
- **Field Redaction** — Automatically mask sensitive fields (passwords, tokens, etc.)
- **Express Integration** — Middleware for automatic request/response logging
- **Async Context Isolation** — AsyncLocalStorage for request scoping
- **Performance Optimized** — Minimal overhead, lazy serialization
- **TypeScript First** — Full type definitions, strict mode
- **ESM/CJS Compatible** — Works with both module systems

---

## 📦 Installation

```bash
npm install @ktuban/structured-logger
```

**Requires**: Node.js 18+

---

## 🚀 Quick Start

### Basic Logging

```typescript
import { StructuredLogger } from "@ktuban/structured-logger";

const logger = new StructuredLogger({
  environment: "production",
  appName: "my-service",
});

logger.info("User created", { userId: 123, email: "user@example.com" });
logger.error("Payment failed", { error, amount: 99.99 });
logger.warn("High response time", { duration: 5000 });
```

### Express Integration

```typescript
import express from "express";
import { StructuredLogger } from "@ktuban/structured-logger";

const app = express();
const logger = new StructuredLogger({
  environment: "production",
  appName: "api-service",
  redactFields: ["password", "token", "apiKey"],
});

// Automatic request/response logging
app.use(logger.expressMiddleware());

app.post("/login", (req, res) => {
  logger.info("Login attempt", { email: req.body.email });
  // password field automatically redacted
  res.json({ success: true });
});
```

### Request Correlation

```typescript
import { StructuredLogger } from "@ktuban/structured-logger";

const logger = new StructuredLogger();

async function handleRequest(req) {
  const requestId = req.headers["x-request-id"];
  
  // All logs within this context automatically include requestId
  return logger.withRequestId(requestId, async () => {
    logger.info("Processing request"); // includes requestId
    
    // Nested calls automatically inherit the requestId
    await callInternalService();
  });
}

async function callInternalService() {
  logger.info("Internal service called"); // includes same requestId
}
```

---

## 📖 API Reference

### StructuredLogger Constructor

```typescript
const logger = new StructuredLogger({
  environment: "production",        // "development" | "staging" | "production"
  appName: "my-service",           // Service name
  version: "1.0.0",                // Optional version
  defaultLevel: "info",            // "debug" | "info" | "warn" | "error"
  redactFields: [                  // Fields to automatically mask
    "password",
    "token",
    "apiKey",
    "creditCard"
  ],
  prettyPrint: true,              // Pretty console output in dev
  outputFormat: "json",           // "json" | "pretty"
});
```

### Logging Methods

```typescript
logger.debug(message, data);
logger.info(message, data);
logger.warn(message, data);
logger.error(message, data);

// Example
logger.error("Payment processing failed", {
  error: new Error("Timeout"),
  amount: 99.99,
  attempt: 3,
});
```

**Output (JSON):**
```json
{
  "level": "error",
  "message": "Payment processing failed",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "amount": 99.99,
  "attempt": 3,
  "error": {
    "message": "Timeout",
    "stack": "Error: Timeout\n    at...",
    "name": "Error"
  }
}
```

### Request Correlation

```typescript
// Bind a request ID to async context
logger.withRequestId(id, callback);

// Inside the callback and all nested calls:
logger.info("message"); // automatically includes requestId

// Manual context:
logger.setContext({ userId: 123, requestId: "req-456" });
logger.info("message"); // includes userId and requestId
```

### Error Handling

```typescript
// Automatic error serialization
logger.error("Operation failed", { error });

// Includes:
// - Error message
// - Full stack trace
// - Cause chain (if present)
// - Context data

// Error with context
try {
  await riskyOperation();
} catch (error) {
  logger.error("Risky operation failed", {
    error,
    userId: req.user.id,
    endpoint: req.path,
  });
}
```

### Express Middleware

```typescript
const logger = new StructuredLogger();

// Automatic request/response logging
app.use(logger.expressMiddleware({
  includeRequestBody: false,  // Don't log request body
  includeResponseBody: false, // Don't log response body
  redactPaths: ["/login"],    // Skip logging for these paths
}));

// Adds to each request:
// - requestId (generated if not provided)
// - method, path, statusCode
// - duration
// - userId (if available)
```

---

## 🎯 Best Practices

1. **Use structured data** instead of string concatenation
   ```typescript
   // ✅ Good
   logger.info("User created", { userId: 123 });
   
   // ❌ Bad
   logger.info(`User ${123} created`);
   ```

2. **Include context** for debugging
   ```typescript
   logger.error("API call failed", {
     error,
     endpoint: url,
     method: "POST",
     statusCode: 500,
   });
   ```

3. **Use appropriate levels**
   - `debug` — Development/diagnostic info
   - `info` — Normal application flow
   - `warn` — Potentially problematic situations
   - `error` — Error events that might still allow the app to continue

4. **Redact sensitive fields**
   ```typescript
   const logger = new StructuredLogger({
     redactFields: ["password", "token", "ssn", "creditCard"],
   });
   ```

5. **Leverage request correlation**
   ```typescript
   // All logs within the request automatically correlated
   logger.withRequestId(req.id, async () => {
     await service1();
     await service2();
     // All logs include the same requestId
   });
   ```

---

## 🔐 Security Notes

- **Sensitive fields** are automatically redacted based on configured patterns
- **Passwords, tokens, API keys** should be added to `redactFields`
- **Error stacks** may contain sensitive info — review before production
- **Request bodies** should generally not be logged in production
- **PII** (personally identifiable information) should be handled carefully

---

## ☕ Support the Project

If this library helps you build observable systems, consider supporting ongoing development:

- [PayPal.me/khaliltuban](https://paypal.me/KhalilTuban)
- [Ko‑fi.com/ktuban](https://ko-fi.com/ktuban)

---

## 📄 License

MIT © K Tuban

## 🤝 Contributing

Pull requests are welcome. Please include tests and documentation updates.

## 🧭 Roadmap

- [ ] CloudWatch integration
- [ ] Datadog support
- [ ] Log sampling strategies
- [ ] Performance metrics collection
- [ ] Custom serializers
