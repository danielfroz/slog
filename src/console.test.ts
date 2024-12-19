import { assert } from 'assert';
import { beforeEach, describe, it } from 'bdd';
import { stub } from 'mock';
import { ConsoleLog, Log } from "../mod.ts";

describe('slog testing', () => {
  const entries = new Array<string>()
  const func = async (...data: any[]) => {
    entries.push(data.join(','))
  }

  beforeEach(() => {
    // clean up entries array
    entries.splice(0, entries.length)
  })

  it('shall log string', () => {
    const log = new ConsoleLog({ func })
    log.info('works fine with basic logging')
    assert(entries.length === 1 , 'expected to have 1 log entry')

    const record = JSON.parse(entries[0])
    assert(record.timestamp != null, 'timestamp is expected')
    assert(record.level === 'INFO', `INFO is expected, instead received: ${record.level}`)
    assert(record.msg === 'works fine with basic logging')
  })

  it('shall log string even with args', () => {
    const log = new ConsoleLog({ func })
    log.info('this is a simple test %o', 'this is part 2')

    assert(entries.length === 1)
    const record = JSON.parse(entries[0])
    assert(record.timestamp != null)
    assert(record.args != null && record.args.length === 1, `expected record.args as array`)
  })

  it('shall log object', () => {
    const log = new ConsoleLog({ func })
    const now = new Date().toString()
    log.info({ msg: `this is a simple test`, always: 'work', timestamp: now })

    assert(entries.length === 1, `expected to have 1 log entry`)
    const record = JSON.parse(entries[0])
    assert(record.always === 'work', `always not equal to work; instead ${record.always}`)
    assert(record.msg === 'this is a simple test', `expected to have msg correctly set; but got ${record.msg}`)
    assert(record.timestamp === now, `expected timestamp to be redefined but got ${record.timestamp}`)
  })

  it('shall log ERROR, WARNING, INFO, DEBUG, TRACE if TRACE is set', () => {
    const log = new ConsoleLog({ level: 'TRACE', func })
    log.trace({ msg: 'this is a trace message' })
    log.debug({ msg: 'this is a debug message' })
    log.info({ msg: 'this is an info message' })
    log.warn({ msg: 'this is a warn message' })
    log.error({ msg: 'this is an error message' })

    assert(entries.length === 5)
    let record = JSON.parse(entries[0])
    assert(record.timestamp != null)
    assert(record.level === 'TRACE')
    assert(record.msg.includes('trace'))
    record = JSON.parse(entries[1])
    assert(record.level === 'DEBUG')
    assert(record.msg.includes('debug'))
    record = JSON.parse(entries[2])
    assert(record.level === 'INFO')
    assert(record.msg.includes('info'))
  })

  it('shall only log ERROR', () => {
    const log = new ConsoleLog({ level: 'ERROR', func })
    log.trace({ msg: 'this is a trace message' })
    log.debug({ msg: 'this is a debug message' })
    log.info({ msg: 'this is an info message' })
    log.warn({ msg: 'this is a warn message' })
    log.error({ msg: 'this is an error message' })

    assert(entries.length === 1)
    const records = JSON.parse(entries[0])
    assert(records.timestamp != null)
    assert(records.msg.includes('error'))
  })
  
  it('shall not log INFO if WARNING', () => {
    const log = new ConsoleLog({ level: 'WARNING', func })
    log.info('shall not log this information')
    assert(entries.length === 0, `expected to filter the info log level`)
  })

  it('child shall consider initial object', () => {
    const glog = new ConsoleLog({ init: { service: 'logging', handler: 'test' }, func })
    const id = crypto.randomUUID()
    const log = glog.child({ sid: id })
    
    log.info({ msg: `this log shall have service, handler and sid` })

    assert(entries.length === 1, 'expected to have 1 log entry')
    const record = JSON.parse(entries[0])
    assert(record.timestamp != null, 'timestamp is expected')
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
})