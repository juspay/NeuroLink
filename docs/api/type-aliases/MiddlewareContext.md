[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / MiddlewareContext

# Type Alias: MiddlewareContext

> **MiddlewareContext** = `object`

Defined in: [types/middleware.ts:91](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L91)

Context passed to middleware for decision making

## Properties

### provider

> **provider**: `string`

Defined in: [types/middleware.ts:93](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L93)

Provider name

---

### model

> **model**: `string`

Defined in: [types/middleware.ts:95](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L95)

Model name

---

### options

> **options**: `Record`\<`string`, `unknown`\>

Defined in: [types/middleware.ts:97](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L97)

Request options

---

### session?

> `optional` **session?**: `object`

Defined in: [types/middleware.ts:99](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L99)

Session information

#### sessionId?

> `optional` **sessionId?**: `string`

#### userId?

> `optional` **userId?**: `string`

---

### metadata?

> `optional` **metadata?**: `Record`\<`string`, [`JsonValue`](JsonValue.md)\>

Defined in: [types/middleware.ts:104](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L104)

Additional metadata
