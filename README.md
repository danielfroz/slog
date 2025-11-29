# Introduction

This is a simple log library. It is meant to be used on projects with Docker /
containerized applications with Deno or Node.

Nothing special really just a simple log...

So why create another log library? Well I don't need more than what is
included... more information just wastes more CPU cycles ... If you need more...
use another library.

# Usage

This is an example of usage

```typescript
import { JsonLog } from "@danielfroz/slog";

const log = new JsonLog();
log.info({ msg: `this is a valid log line` });
```

You may want to add prefix on all log lines from a component... As such use the
following

```typescript
const id = crypto.randomUUID();
const log = new JsonLog({
  level: "INFO",
  init: { handler: "component", id },
});
log.info({ msg: `this is another line` });
```

Output produced shall include the information passed.

```json
{
  "ts": 1764450995937,
  "level": "INFO",
  "handler": "component",
  "id": "4f8deede-cf40-455a-850e-1807f7410486",
  "msg": "this is another line"
}
```
