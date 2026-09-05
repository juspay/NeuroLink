[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLifecycleLoggerSnapshot

# Type Alias: ProxyLifecycleLoggerSnapshot

> **ProxyLifecycleLoggerSnapshot** = `object`

Defined in: [types/proxy.ts:1972](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1972)

Data-quality counters for the bounded lifecycle metadata sink.

## Properties

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:1973](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1973)

---

### schemaVersion

> **schemaVersion**: `number`

Defined in: [types/proxy.ts:1974](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1974)

---

### processInstanceId

> **processInstanceId**: `string`

Defined in: [types/proxy.ts:1975](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1975)

---

### nextSequence

> **nextSequence**: `number`

Defined in: [types/proxy.ts:1976](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1976)

---

### attempted

> **attempted**: `number`

Defined in: [types/proxy.ts:1977](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1977)

---

### enqueued

> **enqueued**: `number`

Defined in: [types/proxy.ts:1978](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1978)

---

### written

> **written**: `number`

Defined in: [types/proxy.ts:1979](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1979)

---

### dropped

> **dropped**: `number`

Defined in: [types/proxy.ts:1980](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1980)

---

### queueDrops

> **queueDrops**: `number`

Defined in: [types/proxy.ts:1981](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1981)

---

### invalidDrops

> **invalidDrops**: `number`

Defined in: [types/proxy.ts:1982](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1982)

---

### writeDrops

> **writeDrops**: `number`

Defined in: [types/proxy.ts:1983](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1983)

---

### writeFailures

> **writeFailures**: `number`

Defined in: [types/proxy.ts:1984](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1984)

---

### writeRetries

> **writeRetries**: `number`

Defined in: [types/proxy.ts:1986](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1986)

Events requeued after a transient lifecycle metadata write failure.

---

### writeTimeouts

> **writeTimeouts**: `number`

Defined in: [types/proxy.ts:1988](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1988)

Slow appends still owned by the original writer, never replayed on timeout.

---

### unconfirmedWrites

> **unconfirmedWrites**: `number`

Defined in: [types/proxy.ts:1990](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1990)

Records in failed appends that may have partially reached the file.

---

### pending

> **pending**: `number`

Defined in: [types/proxy.ts:1991](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1991)

---

### inFlight

> **inFlight**: `number`

Defined in: [types/proxy.ts:1992](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1992)

---

### flushing

> **flushing**: `boolean`

Defined in: [types/proxy.ts:1993](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1993)
