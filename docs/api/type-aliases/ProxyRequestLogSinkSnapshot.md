[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyRequestLogSinkSnapshot

# Type Alias: ProxyRequestLogSinkSnapshot

> **ProxyRequestLogSinkSnapshot** = `object`

Defined in: [types/proxy.ts:738](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L738)

File-sink evidence is independent of model/request success counters.

## Properties

### attempted

> **attempted**: `number`

Defined in: [types/proxy.ts:739](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L739)

---

### written

> **written**: `number`

Defined in: [types/proxy.ts:740](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L740)

---

### inFlight

> **inFlight**: `number`

Defined in: [types/proxy.ts:741](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L741)

---

### pending

> **pending**: `number`

Defined in: [types/proxy.ts:742](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L742)

---

### dropped

> **dropped**: `number`

Defined in: [types/proxy.ts:744](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L744)

Records not admitted because the bounded writer queue was full.

---

### writeTimeouts

> **writeTimeouts**: `number`

Defined in: [types/proxy.ts:745](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L745)

---

### unconfirmedWrites

> **unconfirmedWrites**: `number`

Defined in: [types/proxy.ts:746](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L746)

---

### lastErrorCode?

> `optional` **lastErrorCode?**: `string`

Defined in: [types/proxy.ts:747](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L747)
