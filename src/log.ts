export const LEVELS_NUMS = {
  'TRACE': 1,
  'DEBUG': 2,
  'INFO': 3,
  'WARNING': 4,
  'ERROR': 5,
}

export type LogLevel = keyof typeof LEVELS_NUMS

export interface Log {
  child(init: object): Log
  prefix(init: object): Log
  trace(m: string|object, ...args: any[]): void
  debug(m: string|object, ...args: any[]): void
  info(m: string|object, ...args: any[]): void
  warn(m: string|object, ...args: any[]): void
  error(m: string|object, ...args: any[]): void
  log(level: LogLevel, m: string|object, ...args: any[]): void
}

/**
 * Represents a structured log record in JSON format
 * Core fields (ts, level) are always present and protected from user override
 */
export interface Record {
  /** Timestamp in milliseconds since epoch (UTC) */
  ts: number
  /** Log level (TRACE, DEBUG, INFO, WARNING, ERROR) */
  level: LogLevel
  /** Optional message string */
  msg?: string
  /** Optional additional arguments passed to log methods */
  args?: any[]
  /** User-defined fields */
  [key: string]: any
}