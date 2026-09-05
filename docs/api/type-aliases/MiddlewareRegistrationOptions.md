[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / MiddlewareRegistrationOptions

# Type Alias: MiddlewareRegistrationOptions

> **MiddlewareRegistrationOptions** = `object`

Defined in: [types/middleware.ts:110](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L110)

Middleware registration options

## Properties

### replace?

> `optional` **replace?**: `boolean`

Defined in: [types/middleware.ts:112](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L112)

Whether to replace existing middleware with same ID

---

### defaultEnabled?

> `optional` **defaultEnabled?**: `boolean`

Defined in: [types/middleware.ts:114](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L114)

Whether to enable the middleware by default

---

### globalConfig?

> `optional` **globalConfig?**: `Record`\<`string`, [`JsonValue`](JsonValue.md)\>

Defined in: [types/middleware.ts:116](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L116)

Global configuration for the middleware
