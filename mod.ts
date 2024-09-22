// deno-lint-ignore-file no-explicit-any
export type LogLevel = 'TRACE'|'DEBUG'|'INFO'|'WARNING'|'ERROR'

const LEVELS_NUMS = {
  'TRACE': 1,
  'DEBUG': 2,
  'INFO': 3,
  'WARNING': 5,
  'ERROR': 4,
}

export interface LogOptions {
  level?: LogLevel,
  prefix?: object
}

export class Log {
  constructor(private readonly options?: LogOptions) {}

  child(obj: object): Log {
    return new Log({ 
      ...this.options,
      prefix: obj
    })
  }

  prefix(obj: object): Log {
    return new Log({
      ...this.options,
      prefix: obj
    })
  }

  debug(m: string|object, ...args: any[]) {
    this.log('DEBUG', m, ...args)
  }

  info(m: string|object, ...args: any[]) {
    this.log('INFO', m, ...args)
  }

  warn(m: string|object, ...args: any[]) {
    this.log('WARNING', m, ...args)
  }

  error(m: string|object, ...args: any[]) {
    this.log('ERROR', m, ...args)
  }

  log(level: LogLevel, msg: string|object, ...args: any[]) {
    const now = Date.now()
    const record = typeof(msg) === 'object' ?
    {
      timestamp: now,
      level,
      ...this.options?.prefix,
      ...msg,
      ...args
    }: {
      timestamp: now,
      level,
      ...this.options?.prefix,
      msg,
      ...args
    }

    if(this.options?.level != null) {
      const lvlCode = LEVELS_NUMS[level]
      const lvlConfigured = LEVELS_NUMS[this.options.level]
      if(lvlConfigured > lvlCode) {
        // do nothing
        return
      }
    }

    let func: (...data: any[]) => void
    if(level === 'ERROR') {
      func = console.error
    }
    else {
      func = console.log
    }
    func(JSON.stringify(record))
  }
}