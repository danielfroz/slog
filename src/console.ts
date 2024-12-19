import { type Log, type LogLevel, LEVELS_NUMS } from "./log.ts"

export interface ConsoleLogOptions {
  level?: LogLevel
  init?: object
  func?: (...data: any[]) => void
}

export class ConsoleLog implements Log {
  constructor(readonly options: ConsoleLogOptions = { level: 'INFO' }) {}

  child(init: object): Log {
    return new ConsoleLog({
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
    const now = new Date(new Date().toUTCString()).getTime()
    let record = {
      timestamp: now,
      level,
      ...this.options?.init,
    } as any
    if(typeof(msg) === 'object') {
      record = {
        ...record,
        ...msg
      }
    }
    else {
      record = {
        ...record,
        msg,
      }
    }
    if(args && args.length > 0) {
      record = {
        ...record,
        args
      }
    }

    if(this.options?.level != null) {
      const code = LEVELS_NUMS[level]
      const configured = LEVELS_NUMS[this.options.level]
      if(configured > code) {
        // do nothing
        return
      }
    }

    this.options.func != null ?
      this.options.func(JSON.stringify(record)):
      console.log(JSON.stringify(record))
  }
}