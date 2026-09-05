[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / MiddlewareExecutionResult

# Type Alias: MiddlewareExecutionResult

> **MiddlewareExecutionResult** = `object`

Defined in: [types/middleware.ts:122](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L122)

Middleware execution result

## Properties

### applied

> **applied**: `boolean`

Defined in: [types/middleware.ts:124](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L124)

Whether the middleware was applied

---

### executionTime

> **executionTime**: `number`

Defined in: [types/middleware.ts:126](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L126)

Execution time in milliseconds

---

### error?

> `optional` **error?**: `Error`

Defined in: [types/middleware.ts:128](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L128)

Any errors that occurred

---

### metadata?

> `optional` **metadata?**: `Record`\<`string`, [`JsonValue`](JsonValue.md)\>

Defined in: [types/middleware.ts:130](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L130)

Additional metadata from the middleware
