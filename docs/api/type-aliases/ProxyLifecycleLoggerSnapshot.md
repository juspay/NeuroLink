[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLifecycleLoggerSnapshot

# Type Alias: ProxyLifecycleLoggerSnapshot

> **ProxyLifecycleLoggerSnapshot** = `object`

Defined in: [types/proxy.ts:2008](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2008)

Data-quality counters for the bounded lifecycle metadata sink.

## Properties

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:2009](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2009)

---

### schemaVersion

> **schemaVersion**: `number`

Defined in: [types/proxy.ts:2010](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2010)

---

### processInstanceId

> **processInstanceId**: `string`

Defined in: [types/proxy.ts:2011](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2011)

---

### nextSequence

> **nextSequence**: `number`

Defined in: [types/proxy.ts:2012](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2012)

---

### attempted

> **attempted**: `number`

Defined in: [types/proxy.ts:2013](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2013)

---

### enqueued

> **enqueued**: `number`

Defined in: [types/proxy.ts:2014](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2014)

---

### written

> **written**: `number`

Defined in: [types/proxy.ts:2015](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2015)

---

### dropped

> **dropped**: `number`

Defined in: [types/proxy.ts:2016](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2016)

---

### queueDrops

> **queueDrops**: `number`

Defined in: [types/proxy.ts:2017](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2017)

---

### invalidDrops

> **invalidDrops**: `number`

Defined in: [types/proxy.ts:2018](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2018)

---

### writeDrops

> **writeDrops**: `number`

Defined in: [types/proxy.ts:2019](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2019)

---

### writeFailures

> **writeFailures**: `number`

Defined in: [types/proxy.ts:2020](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2020)

---

### writeRetries

> **writeRetries**: `number`

Defined in: [types/proxy.ts:2022](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2022)

Events requeued after a transient lifecycle metadata write failure.

---

### writeTimeouts

> **writeTimeouts**: `number`

Defined in: [types/proxy.ts:2024](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2024)

Slow appends still owned by the original writer, never replayed on timeout.

---

### unconfirmedWrites

> **unconfirmedWrites**: `number`

Defined in: [types/proxy.ts:2026](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2026)

Records in failed appends that may have partially reached the file.

---

### pending

> **pending**: `number`

Defined in: [types/proxy.ts:2027](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2027)

---

### inFlight

> **inFlight**: `number`

Defined in: [types/proxy.ts:2028](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2028)

---

### flushing

> **flushing**: `boolean`

Defined in: [types/proxy.ts:2029](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2029)
