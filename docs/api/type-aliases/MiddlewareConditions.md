[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / MiddlewareConditions

# Type Alias: MiddlewareConditions

> **MiddlewareConditions** = `object`

Defined in: [types/middleware.ts:77](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L77)

Conditions for applying middleware

## Properties

### providers?

> `optional` **providers?**: `string`[]

Defined in: [types/middleware.ts:79](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L79)

Apply only to specific providers

---

### models?

> `optional` **models?**: `string`[]

Defined in: [types/middleware.ts:81](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L81)

Apply only to specific models

---

### options?

> `optional` **options?**: `Record`\<`string`, `unknown`\>

Defined in: [types/middleware.ts:83](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L83)

Apply only when certain options are present

---

### custom?

> `optional` **custom?**: (`context`) => `boolean`

Defined in: [types/middleware.ts:85](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L85)

Custom condition function

#### Parameters

##### context

[`MiddlewareContext`](MiddlewareContext.md)

#### Returns

`boolean`
