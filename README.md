# Introduction

This is a simple log library. It is meant to be used on projects with Docker /
containerized applications with Deno or Node.

Nothing special really just a simple log...

So why to create another log library? Well I don't need more than what is
included... more information just leads to waste more CPU cycles ... If you need
more... use another library.

# Usage

This is a example of usage

```typescript
const log = new Log();
log.info({ msg: `this is a valid log line` });
```

You may want to add prefix on all log lines from a component... As such use the
following

```typescript
const log = new Log({ prefix: { handler: "component", id: `${requestid}` } });
log.info({ msg: `this is another line` });
```

Output produced shall include the information passed.

```json
{
  "timestamp": 1726965019899,
  "level": "INFO",
  "handler": "component",
  "id": "4f8deede-cf40-455a-850e-1807f7410486",
  "msg": "this is another line"
}
```
