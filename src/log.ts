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