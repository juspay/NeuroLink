[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / LifecycleFinishPayload

# Type Alias: LifecycleFinishPayload

> **LifecycleFinishPayload** = `object`

Defined in: [types/middleware.ts:304](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L304)

Payload delivered to onFinish callbacks after generation or streaming completes.

## Properties

### text

> **text**: `string`

Defined in: [types/middleware.ts:306](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L306)

The generated text content

---

### usage?

> `optional` **usage?**: `object`

Defined in: [types/middleware.ts:308](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L308)

Token usage from the provider

#### promptTokens

> **promptTokens**: `number`

#### completionTokens

> **completionTokens**: `number`

---

### duration

> **duration**: `number`

Defined in: [types/middleware.ts:310](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L310)

Wall-clock duration in milliseconds

---

### finishReason?

> `optional` **finishReason?**: `string`

Defined in: [types/middleware.ts:312](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L312)

Why generation stopped
