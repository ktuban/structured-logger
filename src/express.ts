// middleware/requestId.ts
import { v4 as uuid } from "uuid";
import { StructuredLogger } from "./StructuredLogger.js";


export function requestIdMiddleware(req: any, res: any, next: any) {
  const id = (req.headers["x-request-id"] as string) || uuid();

  (req as any).requestId = id;
  res.locals["requestId"] = id;

  next();
}

export function loggingMiddleware(logger = StructuredLogger.getInstance()) {
  return (req: any, res: any, next: any) => {
    const requestId = (req as any).requestId;

    logger.runWithContext(requestId, () => {
      const start = Date.now();

      res.on("finish", () => {
        logger.http("HTTP Request", {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          duration: Date.now() - start,
          requestId,
          ip: req.ip,
          userAgent: req.get("user-agent") ?? undefined,
          contentLength: res.getHeader("content-length")?.toString()
        });
      });

      next();
    });
  };
}
