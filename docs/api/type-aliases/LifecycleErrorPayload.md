[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / LifecycleErrorPayload

# Type Alias: LifecycleErrorPayload

> **LifecycleErrorPayload** = `object`

Defined in: [types/middleware.ts:318](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L318)

Payload delivered to onError callbacks when generation or streaming fails.

## Properties

### error

> **error**: `Error`

Defined in: [types/middleware.ts:320](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L320)

The error that occurred

---

### duration

> **duration**: `number`

Defined in: [types/middleware.ts:322](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L322)

Wall-clock duration until failure in milliseconds

---

### recoverable

> **recoverable**: `boolean`

Defined in: [types/middleware.ts:324](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L324)

Whether the error is likely recoverable (rate limit, timeout, network)
