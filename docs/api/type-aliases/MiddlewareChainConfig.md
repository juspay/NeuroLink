[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / MiddlewareChainConfig

# Type Alias: MiddlewareChainConfig

> **MiddlewareChainConfig** = `object`

Defined in: [types/middleware.ts:290](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L290)

Middleware chain configuration

## Properties

### middlewares

> **middlewares**: [`MiddlewareFactoryConfig`](MiddlewareFactoryConfig.md)[]

Defined in: [types/middleware.ts:291](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L291)

---

### errorHandling

> **errorHandling**: `"continue"` \| `"stop"` \| `"rollback"`

Defined in: [types/middleware.ts:292](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L292)

---

### timeout?

> `optional` **timeout?**: `number`

Defined in: [types/middleware.ts:293](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L293)

---

### retries?

> `optional` **retries?**: `number`

Defined in: [types/middleware.ts:294](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L294)
