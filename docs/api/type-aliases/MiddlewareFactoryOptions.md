[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / MiddlewareFactoryOptions

# Type Alias: MiddlewareFactoryOptions

> **MiddlewareFactoryOptions** = `object`

Defined in: [types/middleware.ts:176](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L176)

Factory options for middleware

## Properties

### middleware?

> `optional` **middleware?**: [`NeuroLinkMiddleware`](NeuroLinkMiddleware.md)[]

Defined in: [types/middleware.ts:178](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L178)

Custom middleware to register on initialization

---

### enabledMiddleware?

> `optional` **enabledMiddleware?**: `string`[]

Defined in: [types/middleware.ts:180](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L180)

Enable specific middleware

---

### disabledMiddleware?

> `optional` **disabledMiddleware?**: `string`[]

Defined in: [types/middleware.ts:182](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L182)

Disable specific middleware

---

### middlewareConfig?

> `optional` **middlewareConfig?**: `Record`\<`string`, [`MiddlewareConfig`](MiddlewareConfig.md)\>

Defined in: [types/middleware.ts:184](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L184)

Middleware configurations

---

### preset?

> `optional` **preset?**: `string`

Defined in: [types/middleware.ts:186](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L186)

Use a preset configuration

---

### global?

> `optional` **global?**: `object`

Defined in: [types/middleware.ts:188](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L188)

Global middleware settings

#### maxExecutionTime?

> `optional` **maxExecutionTime?**: `number`

Maximum execution time for middleware chain

#### continueOnError?

> `optional` **continueOnError?**: `boolean`

Whether to continue on middleware errors

#### collectStats?

> `optional` **collectStats?**: `boolean`

Whether to collect execution statistics
