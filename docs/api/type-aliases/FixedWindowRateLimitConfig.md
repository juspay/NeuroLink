[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / FixedWindowRateLimitConfig

# Type Alias: FixedWindowRateLimitConfig

> **FixedWindowRateLimitConfig** = `object`

Defined in: [types/middleware.ts:453](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L453)

Simple fixed-window rate-limit configuration.

## Properties

### maxRequests

> **maxRequests**: `number`

Defined in: [types/middleware.ts:454](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L454)

---

### windowMs

> **windowMs**: `number`

Defined in: [types/middleware.ts:455](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L455)

---

### message?

> `optional` **message?**: `string`

Defined in: [types/middleware.ts:456](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L456)

---

### skipPaths?

> `optional` **skipPaths?**: `string`[]

Defined in: [types/middleware.ts:457](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L457)

---

### keyGenerator?

> `optional` **keyGenerator?**: (`ctx`) => `string`

Defined in: [types/middleware.ts:458](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L458)

#### Parameters

##### ctx

[`ServerContext`](ServerContext.md)

#### Returns

`string`

---

### onRateLimitExceeded?

> `optional` **onRateLimitExceeded?**: (`ctx`, `retryAfter`) => `unknown`

Defined in: [types/middleware.ts:459](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L459)

#### Parameters

##### ctx

[`ServerContext`](ServerContext.md)

##### retryAfter

`number`

#### Returns

`unknown`
