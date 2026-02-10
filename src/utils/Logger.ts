import pino, { type Logger } from "pino";
export type { Logger };

// Configure the base logger
const loggerConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  base: undefined, // Remove pid/hostname from logs for cleanliness
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Default to stderr (fd 2) to prevent polluting stdout (critical for MCP/CLI piping)
export const rootLogger = pino(loggerConfig, pino.destination(2));
export const log = rootLogger;

/**
 * Creates a child logger with a bound component name.
 * @param component The name of the component (e.g., 'Ingestor', 'MCP')
 * @returns A pino logger instance suitable for that component
 */
export const getLogger = (component: string) => {
  return rootLogger.child({ component });
};
