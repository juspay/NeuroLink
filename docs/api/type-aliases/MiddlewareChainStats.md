[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / MiddlewareChainStats

# Type Alias: MiddlewareChainStats

> **MiddlewareChainStats** = `object`

Defined in: [types/middleware.ts:136](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L136)

Middleware chain execution statistics

## Properties

### totalMiddleware

> **totalMiddleware**: `number`

Defined in: [types/middleware.ts:138](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L138)

Total number of middleware in the chain

---

### appliedMiddleware

> **appliedMiddleware**: `number`

Defined in: [types/middleware.ts:140](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L140)

Number of middleware that were applied

---

### totalExecutionTime

> **totalExecutionTime**: `number`

Defined in: [types/middleware.ts:142](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L142)

Total execution time for the chain

---

### results

> **results**: `Record`\<`string`, [`MiddlewareExecutionResult`](MiddlewareExecutionResult.md)\>

Defined in: [types/middleware.ts:144](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L144)

Individual middleware execution results
