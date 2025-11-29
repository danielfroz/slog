import { assert } from 'assert';
import { assertThrows } from "assert/throws";
import { beforeEach, describe, it } from 'bdd';
import { stub } from 'mock';
import { JsonLog, Log } from "../mod.ts";
import { LogLevel } from "./log.ts";

describe('slog testing', () => {
  const entries = new Array<string>()
  const func = (...data: any[]) => {
    entries.push(data.join(','))
  }

  beforeEach(() => {
    // clean up entries array
    entries.splice(0, entries.length)
  })

  it('shall log string', () => {
    const before = Date.now()
    const log = new JsonLog({ func })
    log.info('works fine with basic logging')
    const after = Date.now()

    assert(entries.length === 1 , 'expected to have 1 log entry')

    const record = JSON.parse(entries[0])
    assert(typeof record.ts === 'number', 'timestamp should be a number')
    assert(record.ts >= before && record.ts <= after, 'timestamp should be within test execution time')
    assert(record.level === 'INFO', `INFO is expected, instead received: ${record.level}`)
    assert(record.msg === 'works fine with basic logging')
  })

  it('shall log string even with args', () => {
    const log = new JsonLog({ func })
    log.info('this is a simple test %o', 'this is part 2')

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.ts != null)
    assert(record.level === 'INFO')
    assert(record.args != null && record.args.length === 1, `expected record.args as array`)
    assert(record.args[0] === 'this is part 2', `expected to have string args`)
  })

  it('shall not log args if not needed', () => {
    const log = new JsonLog({ func })
    log.info('testing without args')

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.ts != null)
    assert(record.level === 'INFO')
    assert(record.msg === 'testing without args')
    assert(record.args === undefined)
  })

  it('shall log object', () => {
    const log = new JsonLog({ func })
    const now = new Date().toString()
    log.info({ msg: `this is a simple test`, always: 'work', timestamp: now })

    assert(entries.length === 1, `expected to have 1 log entry`)
    const record = JSON.parse(entries[0])
    assert(record.always === 'work', `always not equal to work; instead ${record.always}`)
    assert(record.msg === 'this is a simple test', `expected to have msg correctly set; but got ${record.msg}`)
    assert(record.timestamp === now, `expected timestamp to be redefined but got ${record.timestamp}`)
  })

  it('shall log object with args', () => {
    const log = new JsonLog({ func })
    log.info({ msg: `this is a simple test`}, { another: 'args come later' })
    
    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.ts != null)
    assert(record.level === 'INFO')
    assert(record.msg === 'this is a simple test')
    assert(record.args != null)
    assert(typeof(record.args[0]) === 'object')
  })

  it('shall log ERROR, WARNING, INFO, DEBUG, TRACE if TRACE is set', () => {
    const log = new JsonLog({ level: 'TRACE', func })
    log.trace({ msg: 'this is a trace message' })
    log.debug({ msg: 'this is a debug message' })
    log.info({ msg: 'this is an info message' })
    log.warn({ msg: 'this is a warn message' })
    log.error({ msg: 'this is an error message' })

    assert(entries.length === 5, 'expected all 5 levels to be logged')
    let record = JSON.parse(entries[0])
    assert(record.ts != null)
    assert(record.level === 'TRACE')
    assert(record.msg.includes('trace'))
    record = JSON.parse(entries[1])
    assert(record.level === 'DEBUG')
    assert(record.msg.includes('debug'))
    record = JSON.parse(entries[2])
    assert(record.level === 'INFO')
    assert(record.msg.includes('info'))
    record = JSON.parse(entries[3])
    assert(record.level === 'WARNING')
    assert(record.msg.includes('warn'))
    record = JSON.parse(entries[4])
    assert(record.level === 'ERROR')
    assert(record.msg.includes('error'))
  })

  it('shall only log ERROR', () => {
    const log = new JsonLog({ level: 'ERROR', func })
    log.trace({ msg: 'this is a trace message' })
    log.debug({ msg: 'this is a debug message' })
    log.info({ msg: 'this is an info message' })
    log.warn({ msg: 'this is a warn message' })
    log.error({ msg: 'this is an error message' })

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.ts != null)
    assert(record.level === 'ERROR')
    assert(record.msg.includes('error'))
  })

  it('shall not log INFO if WARNING', () => {
    const log = new JsonLog({ level: 'WARNING', func })
    log.info('shall not log this information')
    assert(entries.length === 0, `expected to filter the info log level`)
  })

  it('shall revert to default LogLevel INFO if invalid LogLevel', () => {
    const log = new JsonLog({ level: 'INVALID' as LogLevel, func })
    log.info('working fine')
    log.debug('shall not consider this one')
    assert(entries.length === 1, `expected to log only info level`)
  })

  it('shall thrown error when invalid LogLevel and throwOnError: true', () => {
    assertThrows(() => new JsonLog({ throwOnError: true }), Error, 'level.invalid')
  })

  it('shall fail if init is a string', () => {
    assertThrows(() => new JsonLog({ init: 'string' as any }), Error, 'init.invalid')
  })

  it('child shall consider initial object', () => {
    const glog = new JsonLog({ init: { service: 'logging', handler: 'test' }, func })
    const id = crypto.randomUUID()
    const log = glog.child({ sid: id })
    
    log.info({ msg: `this log shall have service, handler and sid` })

    assert(entries.length === 1, 'expected to have 1 log entry')
    const record = JSON.parse(entries[0])
    assert(record.ts != null, 'timestamp is expected')
    assert(record.level === 'INFO', `expected INFO instead received ${record.level}`)
    assert(record.sid === id, `expected sid but received ${record.sid}`)
    assert(record.service === 'logging', `expected service but received: ${record.service}`)
    assert(record.handler === 'test', `handler shall be test but is ${record.handler}`)
    assert(record.msg === 'this log shall have service, handler and sid')
  })

  it('shall work easily with stubs', () => {
    const log = {} as Log
    stub(log, 'child', (init: object) => {
      entries.push(JSON.stringify(init))
      return {} as Log
    })

    log.child({ works: true })
    assert(entries.length === 1)
    const init = JSON.parse(entries[0])
    assert(init.works)
  })

  it('shall handle circular references without crashing', () => {
    const log = new JsonLog({ func })
    const circular: any = { name: 'circular object' }
    circular.self = circular  // Create circular reference
    circular.nested = { parent: circular }  // Nested circular reference

    log.info({ msg: 'testing circular reference', data: circular })

    assert(entries.length === 1, 'expected to have 1 log entry')
    const output = entries[0]
    assert(output.includes('[Circular]'), 'expected output to contain [Circular] marker')
    assert(output.includes('circular object'), 'expected output to contain the object name')
  })

  it('shall serialize Error objects properly', () => {
    const log = new JsonLog({ func })
    const error = new Error('test error message')
    error.name = 'TestError'

    log.error({ msg: 'error occurred', error })

    assert(entries.length === 1, 'expected to have 1 log entry')
    const record = JSON.parse(entries[0])
    assert(record.error != null, 'expected error field to exist')
    assert(record.error.name === 'TestError', 'expected error name to be serialized')
    assert(record.error.message === 'test error message', 'expected error message to be serialized')
    assert(record.error.stack != null, 'expected error stack to be serialized')
  })

  it('shall protect reserved fields from being overwritten', () => {
    const log = new JsonLog({ func })
    const maliciousTs = 123456789
    const maliciousLevel = 'FAKE' as any

    log.info({ msg: 'test', ts: maliciousTs, level: maliciousLevel })

    assert(entries.length === 1, 'expected to have 1 log entry')
    const record = JSON.parse(entries[0])
    assert(record.ts !== maliciousTs, 'ts field should not be overwritten by user data')
    assert(record.level === 'INFO', 'level field should not be overwritten by user data')
    assert(record.msg === 'test', 'msg field should be present')
  })

  it('shall handle deeply nested Error objects in circular structures', () => {
    const log = new JsonLog({ func })
    const obj: any = {
      msg: 'complex structure',
      error: new Error('nested error')
    }
    obj.circular = obj  // Add circular reference

    log.error(obj)

    assert(entries.length === 1, 'expected to have 1 log entry')
    const output = entries[0]
    assert(output.includes('[Circular]'), 'expected circular reference to be handled')
    assert(output.includes('nested error'), 'expected error message to be present')
    const record = JSON.parse(entries[0])
    assert(record.error.message === 'nested error', 'expected error to be serialized')
  })

  it('shall support synchronous func execution', () => {
    const syncEntries: string[] = []
    const syncFunc = (...data: any[]) => {
      syncEntries.push(data.join(','))
    }

    const log = new JsonLog({ func: syncFunc })
    log.info('sync test')

    assert(syncEntries.length === 1, 'expected sync func to be called immediately')
    const record = JSON.parse(syncEntries[0])
    assert(record.msg === 'sync test')
  })

  it('shall support asynchronous func execution', async () => {
    const asyncEntries: string[] = []
    const asyncFunc = async (...data: any[]) => {
      await new Promise(resolve => setTimeout(resolve, 10))
      asyncEntries.push(data.join(','))
    }

    const log = new JsonLog({ func: asyncFunc })
    log.info('async test')

    // Log method returns immediately (non-blocking)
    assert(asyncEntries.length === 0, 'expected async func to not block')

    // Wait for async completion
    await new Promise(resolve => setTimeout(resolve, 20))

    assert(asyncEntries.length >= 1, 'expected async func to complete')
    const record = JSON.parse(asyncEntries[0]!)
    assert(record.msg === 'async test')
  })

  it('shall handle errors in async func without crashing', async () => {
    const errorFunc = async (..._data: any[]) => {
      throw new Error('async error')
    }

    const log = new JsonLog({ func: errorFunc })

    // Should not throw - error is caught internally
    log.info('test with failing async func')

    // Wait for async error handling
    await new Promise(resolve => setTimeout(resolve, 10))

    // Test passes if we get here without crashing
    assert(true, 'expected error to be handled gracefully')
  })

  it('shall support prefix() method', () => {
    const log = new JsonLog({ func })
    const prefixed = log.prefix({ service: 'auth' })

    prefixed.info('user logged in')

    assert(entries.length === 1, 'expected to have 1 log entry')
    const record = JSON.parse(entries[0])
    assert(record.service === 'auth', 'expected service field from prefix')
    assert(record.msg === 'user logged in')
  })

  it('shall support trace() method directly', () => {
    const log = new JsonLog({ level: 'TRACE', func })
    log.trace('trace message')

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.level === 'TRACE')
    assert(record.msg === 'trace message')
  })

  it('shall handle null as message', () => {
    const log = new JsonLog({ func })
    log.info(null as any)

    assert(entries.length === 1, 'expected to have 1 log entry')
    const record = JSON.parse(entries[0])
    assert(record.ts != null)
    assert(record.level === 'INFO')
  })

  it('shall handle undefined as message', () => {
    const log = new JsonLog({ func })
    log.info(undefined as any)

    assert(entries.length === 1, 'expected to have 1 log entry')
    const record = JSON.parse(entries[0])
    assert(record.ts != null)
    assert(record.level === 'INFO')
  })

  it('shall handle empty object as message', () => {
    const log = new JsonLog({ func })
    log.info({})

    assert(entries.length === 1, 'expected to have 1 log entry')
    const record = JSON.parse(entries[0])
    assert(record.ts != null)
    assert(record.level === 'INFO')
    assert(record.msg === undefined, 'empty object should not create msg field')
  })

  it('shall handle empty string as message', () => {
    const log = new JsonLog({ func })
    log.info('')

    assert(entries.length === 1, 'expected to have 1 log entry')
    const record = JSON.parse(entries[0])
    assert(record.msg === '', 'empty string should be preserved')
  })

  it('shall handle multiple arguments', () => {
    const log = new JsonLog({ func })
    log.info('message', 'arg1', 'arg2', 'arg3')

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.msg === 'message')
    assert(record.args.length === 3, 'expected 3 args')
    assert(record.args[0] === 'arg1')
    assert(record.args[1] === 'arg2')
    assert(record.args[2] === 'arg3')
  })

  it('shall protect reserved fields in init options', () => {
    const maliciousInit = { ts: 999, level: 'FAKE', msg: 'init msg' }
    const log = new JsonLog({ init: maliciousInit, func })
    log.info('test message')

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.ts !== 999, 'init should not override ts')
    assert(record.level === 'INFO', 'init should not override level')
    assert(record.msg === 'test message', 'message should override init msg')
  })

  it('shall inherit level in child logger', () => {
    const parent = new JsonLog({ level: 'ERROR', func })
    const child = parent.child({ scope: 'child' })

    child.info('should not log')
    child.error('should log')

    assert(entries.length === 1, 'child should inherit ERROR level from parent')
    const record = JSON.parse(entries[0])
    assert(record.level === 'ERROR')
    assert(record.scope === 'child')
  })

  it('shall support nested child loggers', () => {
    const parent = new JsonLog({ init: { layer: 'parent' }, func })
    const child1 = parent.child({ layer: 'child1' })
    const child2 = child1.child({ layer: 'child2' })

    child2.info('deeply nested')

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.layer === 'child2', 'deepest child should override layer')
    assert(record.msg === 'deeply nested')
  })

  it('shall use console.log when func is not provided', () => {
    const originalLog = console.log
    const consoleEntries: string[] = []
    console.log = (...args: any[]) => {
      consoleEntries.push(args.join(','))
    }

    try {
      const log = new JsonLog()
      log.info('console test')

      assert(consoleEntries.length === 1, 'expected console.log to be called')
      const record = JSON.parse(consoleEntries[0])
      assert(record.msg === 'console test')
    } finally {
      console.log = originalLog
    }
  })

  it('shall handle special characters in messages', () => {
    const log = new JsonLog({ func })
    log.info('unicode: 日本語, newline:\n, tab:\t, quote: "test"')

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.msg.includes('日本語'), 'should preserve unicode')
    assert(record.msg.includes('\n'), 'should preserve newlines')
    assert(record.msg.includes('\t'), 'should preserve tabs')
  })

  it('shall allow user data to override init fields (non-reserved)', () => {
    const log = new JsonLog({ init: { env: 'dev', version: '1.0' }, func })
    log.info({ msg: 'test', env: 'prod' })

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.env === 'prod', 'user data should override init.env')
    assert(record.version === '1.0', 'init.version should remain')
    assert(record.msg === 'test')
  })
})