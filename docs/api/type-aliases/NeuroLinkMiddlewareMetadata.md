[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / NeuroLinkMiddlewareMetadata

# Type Alias: NeuroLinkMiddlewareMetadata

> **NeuroLinkMiddlewareMetadata** = `object`

Defined in: [types/middleware.ts:38](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L38)

Metadata type for NeuroLink middleware
Provides additional information about middleware without affecting execution

## Properties

### id

> **id**: `string`

Defined in: [types/middleware.ts:40](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L40)

Unique identifier for the middleware

---

### name

> **name**: `string`

Defined in: [types/middleware.ts:42](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L42)

Human-readable name

---

### description?

> `optional` **description?**: `string`

Defined in: [types/middleware.ts:44](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L44)

Description of what the middleware does

---

### priority?

> `optional` **priority?**: `number`

Defined in: [types/middleware.ts:46](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L46)

Priority for ordering (higher = earlier in chain)

---

### defaultEnabled?

> `optional` **defaultEnabled?**: `boolean`

Defined in: [types/middleware.ts:48](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L48)

Whether this middleware is enabled by default

---

### configSchema?

> `optional` **configSchema?**: `Record`\<`string`, `unknown`\>

Defined in: [types/middleware.ts:50](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L50)

Configuration schema for the middleware
