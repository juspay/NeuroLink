[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLifecycleLoggerSnapshot

# Type Alias: ProxyLifecycleLoggerSnapshot

> **ProxyLifecycleLoggerSnapshot** = `object`

Defined in: [types/proxy.ts:2012](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2012)

Data-quality counters for the bounded lifecycle metadata sink.

## Properties

### sink?

> `optional` **sink?**: `"otel"` \| `"file"`

Defined in: [types/proxy.ts:2013](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2013)

---

### admissionPolicy?

> `optional` **admissionPolicy?**: `"best-effort"` \| `"durable-file"`

Defined in: [types/proxy.ts:2014](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2014)

---

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:2015](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2015)

---

### schemaVersion

> **schemaVersion**: `number`

Defined in: [types/proxy.ts:2016](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2016)

---

### processInstanceId

> **processInstanceId**: `string`

Defined in: [types/proxy.ts:2017](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2017)

---

### nextSequence

> **nextSequence**: `number`

Defined in: [types/proxy.ts:2018](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2018)

---

### attempted

> **attempted**: `number`

Defined in: [types/proxy.ts:2019](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2019)

---

### enqueued

> **enqueued**: `number`

Defined in: [types/proxy.ts:2020](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2020)

---

### written

> **written**: `number`

Defined in: [types/proxy.ts:2021](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2021)

---

### dropped

> **dropped**: `number`

Defined in: [types/proxy.ts:2022](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2022)

---

### queueDrops

> **queueDrops**: `number`

Defined in: [types/proxy.ts:2023](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2023)

---

### invalidDrops

> **invalidDrops**: `number`

Defined in: [types/proxy.ts:2024](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2024)

---

### writeDrops

> **writeDrops**: `number`

Defined in: [types/proxy.ts:2025](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2025)

---

### writeFailures

> **writeFailures**: `number`

Defined in: [types/proxy.ts:2026](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2026)

---

### writeRetries

> **writeRetries**: `number`

Defined in: [types/proxy.ts:2028](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2028)

Events requeued after a transient lifecycle metadata write failure.

---

### writeTimeouts

> **writeTimeouts**: `number`

Defined in: [types/proxy.ts:2030](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2030)

Slow appends still owned by the original writer, never replayed on timeout.

---

### unconfirmedWrites

> **unconfirmedWrites**: `number`

Defined in: [types/proxy.ts:2032](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2032)

Records in failed appends that may have partially reached the file.

---

### pending

> **pending**: `number`

Defined in: [types/proxy.ts:2033](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2033)

---

### inFlight

> **inFlight**: `number`

Defined in: [types/proxy.ts:2034](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2034)

---

### flushing

> **flushing**: `boolean`

Defined in: [types/proxy.ts:2035](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2035)
