[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / MiddlewareConfig

# Type Alias: MiddlewareConfig

> **MiddlewareConfig** = `object`

Defined in: [types/middleware.ts:65](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L65)

Middleware configuration options

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [types/middleware.ts:67](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L67)

Whether the middleware is enabled

---

### config?

> `optional` **config?**: `Record`\<`string`, `unknown`\>

Defined in: [types/middleware.ts:69](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L69)

Middleware-specific configuration

---

### conditions?

> `optional` **conditions?**: [`MiddlewareConditions`](MiddlewareConditions.md)

Defined in: [types/middleware.ts:71](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L71)

Conditions under which to apply this middleware
