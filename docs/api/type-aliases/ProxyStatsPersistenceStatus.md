[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyStatsPersistenceStatus

# Type Alias: ProxyStatsPersistenceStatus

> **ProxyStatsPersistenceStatus** = `object`

Defined in: [types/proxy.ts:1249](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1249)

Durability and reconciliation state for the proxy usage counters.

## Properties

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:1250](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1250)

---

### filePath

> **filePath**: `string` \| `null`

Defined in: [types/proxy.ts:1251](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1251)

---

### revision

> **revision**: `number`

Defined in: [types/proxy.ts:1252](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1252)

---

### pendingMutations

> **pendingMutations**: `number`

Defined in: [types/proxy.ts:1253](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1253)

---

### inFlightMutations

> **inFlightMutations**: `number`

Defined in: [types/proxy.ts:1254](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1254)

---

### unpersistedMutations

> **unpersistedMutations**: `number`

Defined in: [types/proxy.ts:1255](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1255)

---

### lastFlushedAt

> **lastFlushedAt**: `number` \| `null`

Defined in: [types/proxy.ts:1256](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1256)

---

### lastReconciledAt

> **lastReconciledAt**: `number` \| `null`

Defined in: [types/proxy.ts:1257](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1257)

---

### lastRecoveryAt

> **lastRecoveryAt**: `number` \| `null`

Defined in: [types/proxy.ts:1258](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1258)

---

### lastError

> **lastError**: `string` \| `null`

Defined in: [types/proxy.ts:1259](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1259)

---

### terminalErrorsFilePath?

> `optional` **terminalErrorsFilePath?**: `string` \| `null`

Defined in: [types/proxy.ts:1260](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1260)

---

### terminalErrorsRevision?

> `optional` **terminalErrorsRevision?**: `number`

Defined in: [types/proxy.ts:1261](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1261)

---

### terminalErrorsPending?

> `optional` **terminalErrorsPending?**: `number`

Defined in: [types/proxy.ts:1262](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1262)

---

### terminalErrorsInFlight?

> `optional` **terminalErrorsInFlight?**: `number`

Defined in: [types/proxy.ts:1263](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1263)

---

### terminalErrorsUnpersisted?

> `optional` **terminalErrorsUnpersisted?**: `number`

Defined in: [types/proxy.ts:1264](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1264)

---

### terminalErrorsLastFlushedAt?

> `optional` **terminalErrorsLastFlushedAt?**: `number` \| `null`

Defined in: [types/proxy.ts:1265](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1265)

---

### terminalErrorsLastRecoveryAt?

> `optional` **terminalErrorsLastRecoveryAt?**: `number` \| `null`

Defined in: [types/proxy.ts:1266](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1266)

---

### terminalErrorsLastError?

> `optional` **terminalErrorsLastError?**: `string` \| `null`

Defined in: [types/proxy.ts:1267](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1267)
