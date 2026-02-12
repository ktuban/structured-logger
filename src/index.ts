
export * from "./StructuredLogger.js"
export * from "./express.utils.js"

/*
import { StructuredLogger } from "./StructuredLogger.js";

export const logger = StructuredLogger.getInstance({
  level:  process.env["LOG_LEVEL"] as any,
  format: "json" //process.env["LOG_FORMAT"] as any,
  filePath: process.env["LOG_FILE"],
});

logger.info("logger created");
*/
