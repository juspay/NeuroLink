[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyStatsPersistenceStatus

# Type Alias: ProxyStatsPersistenceStatus

> **ProxyStatsPersistenceStatus** = `object`

Defined in: [types/proxy.ts:1226](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1226)

Durability and reconciliation state for the proxy usage counters.

## Properties

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:1227](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1227)

---

### filePath

> **filePath**: `string` \| `null`

Defined in: [types/proxy.ts:1228](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1228)

---

### revision

> **revision**: `number`

Defined in: [types/proxy.ts:1229](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1229)

---

### pendingMutations

> **pendingMutations**: `number`

Defined in: [types/proxy.ts:1230](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1230)

---

### inFlightMutations

> **inFlightMutations**: `number`

Defined in: [types/proxy.ts:1231](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1231)

---

### unpersistedMutations

> **unpersistedMutations**: `number`

Defined in: [types/proxy.ts:1232](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1232)

---

### lastFlushedAt

> **lastFlushedAt**: `number` \| `null`

Defined in: [types/proxy.ts:1233](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1233)

---

### lastReconciledAt

> **lastReconciledAt**: `number` \| `null`

Defined in: [types/proxy.ts:1234](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1234)

---

### lastRecoveryAt

> **lastRecoveryAt**: `number` \| `null`

Defined in: [types/proxy.ts:1235](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1235)

---

### lastError

> **lastError**: `string` \| `null`

Defined in: [types/proxy.ts:1236](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1236)

---

### terminalErrorsFilePath?

> `optional` **terminalErrorsFilePath?**: `string` \| `null`

Defined in: [types/proxy.ts:1237](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1237)

---

### terminalErrorsRevision?

> `optional` **terminalErrorsRevision?**: `number`

Defined in: [types/proxy.ts:1238](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1238)

---

### terminalErrorsPending?

> `optional` **terminalErrorsPending?**: `number`

Defined in: [types/proxy.ts:1239](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1239)

---

### terminalErrorsInFlight?

> `optional` **terminalErrorsInFlight?**: `number`

Defined in: [types/proxy.ts:1240](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1240)

---

### terminalErrorsUnpersisted?

> `optional` **terminalErrorsUnpersisted?**: `number`

Defined in: [types/proxy.ts:1241](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1241)

---

### terminalErrorsLastFlushedAt?

> `optional` **terminalErrorsLastFlushedAt?**: `number` \| `null`

Defined in: [types/proxy.ts:1242](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1242)

---

### terminalErrorsLastRecoveryAt?

> `optional` **terminalErrorsLastRecoveryAt?**: `number` \| `null`

Defined in: [types/proxy.ts:1243](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1243)

---

### terminalErrorsLastError?

> `optional` **terminalErrorsLastError?**: `string` \| `null`

Defined in: [types/proxy.ts:1244](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1244)
