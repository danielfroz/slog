import { type Log, type LogLevel, type Record, LEVELS_NUMS } from "./log.ts"

const RECORD_RESERVED_KEYS = new Set([ 'ts', 'level' ])

export interface JsonLogOptions {
  level?: LogLevel
  init?: object
  /** Custom output function - supports both sync and async */
  func?: (...data: any[]) => void | Promise<void>
  /** you may want to fail if LogLevel or other parameter is incorrectly used */
  throwOnError?: boolean
}

/**
 * Safely serializes objects to JSON, handling errors and circular references
 * Uses fast path (no circular checks) for common case, falls back only when needed
 */
function safeStringify(obj: any): string {
  try {
    // Fast path: only handle Error objects (no WeakSet overhead)
    return JSON.stringify(obj, (_key, value) => {
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack
        }
      }
      return value
    })
  } catch {
    // Slow path: circular reference detected, use full handling
    const seen = new WeakSet()
    return JSON.stringify(obj, (_key, value) => {
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack
        }
      }
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]'
        seen.add(value)
      }
      return value
    })
  }
}

/**
 * JSON-formatted structured logger implementation
 * Outputs log records as JSON strings to console or custom function
 */
export class JsonLog implements Log {
  constructor(readonly options: JsonLogOptions = { level: 'INFO', throwOnError: false }) {
    // check if supported LogLevel; in case it is not supported, assumes INFO as default value
    const level = this.options.level
    if(level !== 'DEBUG' && level !== 'ERROR' && level !== 'INFO' && level !== 'TRACE' && level !== 'WARNING') {
      if(this.options.throwOnError)
        throw new Error('JsonLog.level.invalid')
      this.options.level = 'INFO'
    }
    // check if init is really a object
    if(this.options.init && typeof(this.options.init) !== 'object') {
      throw new Error('JsonLog.init.invalid')
    }
  }

  child(init: object): Log {
    if(!init)
      throw new Error('child.init')
    if(typeof(init) !== 'object')
      throw new Error('child.init.invalid')
    return new JsonLog({
      ...this.options,
      init: this.options ? {
        ...this.options.init,
        ...init
      }: {
        ...init
      }
    })
  }

  prefix(init: object): Log {
    return this.child(init)
  }

  trace(msg: string | object, ...args: any[]): void {
    this.log('TRACE', msg, ...args)
  }

  debug(msg: string | object, ...args: any[]): void {
    this.log('DEBUG', msg, ...args)
  }

  info(msg: string | object, ...args: any[]): void {
    this.log('INFO', msg, ...args)
  }

  warn(msg: string | object, ...args: any[]): void {
    this.log('WARNING', msg, ...args)
  }
  
  error(msg: string | object, ...args: any[]): void {
    this.log('ERROR', msg, ...args)
  }

  log(level: LogLevel, msg: string | object, ...args: any[]): void {
    const msgFiltered = typeof(msg) === 'object' && msg !== null ?
      Object.fromEntries(
        Object.entries(msg).filter(([key]) => !RECORD_RESERVED_KEYS.has(key))
      ):
      typeof(msg) === 'string' ? { msg } : {}

    // Filter reserved fields from init as well
    const initFiltered = this.options?.init ?
      Object.fromEntries(
        Object.entries(this.options.init).filter(([key]) => !RECORD_RESERVED_KEYS.has(key))
      ) : {}

    const now = Date.now()
    const record = {
      ts: now,
      level,
      ...initFiltered,
      ...msgFiltered,
      ...(args?.length ? { args }: {})
    } as Record

    if(this.options?.level != null) {
      const code = LEVELS_NUMS[level]
      const configured = LEVELS_NUMS[this.options.level]
      if(configured > code) {
        // do nothing
        return
      }
    }

    if (this.options.func != null) {
      const result = this.options.func(safeStringify(record))
      // Handle async functions - catch errors but don't block
      if (result instanceof Promise) {
        result.catch((err) => {
          // Log async errors as structured records for consistency
          const errorRecord: Record = {
            ts: Date.now(),
            level: 'ERROR',
            msg: 'async func error',
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            source: record
          }
          console.log(safeStringify(errorRecord))
        })
      }
    } else {
      console.log(safeStringify(record))
    }
  }
}