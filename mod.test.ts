import { assert } from 'assert';
import * as bdd from 'bdd';
import { Log } from "./mod.ts";

bdd.describe('slog testing', () => {
  const entries = new Array<string>()
  const func = async (...data: any[]) => {
    entries.push(data.join(','))
  }

  bdd.beforeEach(() => {
    // clean up entries array
    entries.splice(0, entries.length)
  })

  bdd.it('simple: LogLevel WARNING', () => {
    const log = new Log({ level: 'WARNING' })
    log.info('shall not log this information')
    assert(entries.length === 0, `expected to filter the info log level`)
  })

  bdd.it('simple: works', () => {
    const log = new Log({ func })
    log.info('works fine with basic logging')

    assert(entries.length === 1 , 'expected to have 1 log entry')
    const logobject = JSON.parse(entries[0])
    assert(logobject.timestamp != null, 'timestamp is expected')
    assert(logobject.level === 'INFO', `INFO is expected, instead received: ${logobject.level}`)
    assert(logobject.msg === 'works fine with basic logging')
  })

  bdd.it('child: keeps object from children', () => {
    const glog = new Log({ func, prefix: { service: 'logging' }})
    const id = crypto.randomUUID()
    const log = glog.child({ sid: id })
    log.info('works ok')

    assert(entries.length === 1, 'expected to have 1 log entry')
    const logobject = JSON.parse(entries[0])
    assert(logobject.timestamp != null, 'timestamp is expected')
    assert(logobject.level === 'INFO', `expected INFO instead received ${logobject.level}`)
    assert(logobject.sid === id, `expected sid but received ${logobject.sid}`)
    assert(logobject.service === 'logging', `expected service but received: ${logobject.service}`)
    assert(logobject.msg === 'works ok')
  })
})