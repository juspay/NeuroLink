[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / PropertySchema

# Type Alias: PropertySchema

> **PropertySchema** = `object`

Defined in: [types/middleware.ts:501](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L501)

Schema for an individual property in ValidationSchema.

## Properties

### type

> **type**: `"string"` \| `"number"` \| `"boolean"` \| `"object"` \| `"array"`

Defined in: [types/middleware.ts:502](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L502)

---

### minimum?

> `optional` **minimum?**: `number`

Defined in: [types/middleware.ts:503](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L503)

---

### maximum?

> `optional` **maximum?**: `number`

Defined in: [types/middleware.ts:504](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L504)

---

### minLength?

> `optional` **minLength?**: `number`

Defined in: [types/middleware.ts:505](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L505)

---

### maxLength?

> `optional` **maxLength?**: `number`

Defined in: [types/middleware.ts:506](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L506)

---

### minItems?

> `optional` **minItems?**: `number`

Defined in: [types/middleware.ts:507](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L507)

---

### maxItems?

> `optional` **maxItems?**: `number`

Defined in: [types/middleware.ts:508](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L508)

---

### pattern?

> `optional` **pattern?**: `string`

Defined in: [types/middleware.ts:509](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L509)

---

### enum?

> `optional` **enum?**: `unknown`[]

Defined in: [types/middleware.ts:510](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L510)

---

### default?

> `optional` **default?**: `unknown`

Defined in: [types/middleware.ts:511](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L511)

---

### validate?

> `optional` **validate?**: (`value`) => `boolean` \| `string`

Defined in: [types/middleware.ts:512](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L512)

#### Parameters

##### value

`unknown`

#### Returns

`boolean` \| `string`
