[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / StatusStats

# Type Alias: StatusStats

> **StatusStats** = `object`

Defined in: [types/proxy.ts:3217](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3217)

Stats shape consumed by the proxy status printer.

## Properties

### startedAt?

> `optional` **startedAt?**: `number`

Defined in: [types/proxy.ts:3218](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3218)

---

### totalAttempts?

> `optional` **totalAttempts?**: `number`

Defined in: [types/proxy.ts:3219](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3219)

---

### totalAttemptErrors?

> `optional` **totalAttemptErrors?**: `number`

Defined in: [types/proxy.ts:3220](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3220)

---

### totalRequests

> **totalRequests**: `number`

Defined in: [types/proxy.ts:3221](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3221)

---

### totalSuccess

> **totalSuccess**: `number`

Defined in: [types/proxy.ts:3222](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3222)

---

### totalErrors

> **totalErrors**: `number`

Defined in: [types/proxy.ts:3223](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3223)

---

### totalRateLimits

> **totalRateLimits**: `number`

Defined in: [types/proxy.ts:3224](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3224)

---

### totalTransientRateLimits?

> `optional` **totalTransientRateLimits?**: `number`

Defined in: [types/proxy.ts:3225](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3225)

---

### totalQuotaRateLimits?

> `optional` **totalQuotaRateLimits?**: `number`

Defined in: [types/proxy.ts:3226](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3226)

---

### terminalErrors?

> `optional` **terminalErrors?**: [`ProxyTerminalErrorJournal`](ProxyTerminalErrorJournal.md)

Defined in: [types/proxy.ts:3227](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3227)

---

### lastTerminalError?

> `optional` **lastTerminalError?**: [`ProxyTerminalErrorSummary`](ProxyTerminalErrorSummary.md) \| `null`

Defined in: [types/proxy.ts:3228](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3228)

---

### terminalErrorDetailsComparable?

> `optional` **terminalErrorDetailsComparable?**: `boolean`

Defined in: [types/proxy.ts:3229](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3229)

---

### terminalErrorDetailsMissing?

> `optional` **terminalErrorDetailsMissing?**: `number`

Defined in: [types/proxy.ts:3230](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3230)

---

### terminalErrorDetailsExcess?

> `optional` **terminalErrorDetailsExcess?**: `number`

Defined in: [types/proxy.ts:3231](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3231)

---

### snapshotSource?

> `optional` **snapshotSource?**: `"reconciled"` \| `"memory"`

Defined in: [types/proxy.ts:3233](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3233)

Whether this status response reconciled shared state or used local memory.

---

### accounts?

> `optional` **accounts?**: `object`[]

Defined in: [types/proxy.ts:3234](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3234)

#### key?

> `optional` **key?**: `string` \| `null`

Provider-qualified key; null for explicitly unattributed legacy rows.

#### provider?

> `optional` **provider?**: `"anthropic"` \| `"codex"` \| `"other"` \| `"unknown"`

#### label

> **label**: `string`

#### type

> **type**: `string`

#### attempts?

> `optional` **attempts?**: `number`

#### requests?

> `optional` **requests?**: `number`

#### success?

> `optional` **success?**: `number`

#### errors?

> `optional` **errors?**: `number`

#### attemptErrors?

> `optional` **attemptErrors?**: `number`

#### rateLimits?

> `optional` **rateLimits?**: `number`

#### transientRateLimits?

> `optional` **transientRateLimits?**: `number`

#### quotaRateLimits?

> `optional` **quotaRateLimits?**: `number`

#### cooling

> **cooling**: `boolean`

#### allowed?

> `optional` **allowed?**: `boolean`

#### expired?

> `optional` **expired?**: `boolean`

#### status?

> `optional` **status?**: `"active"` \| `"cooling"` \| `"disabled"` \| `"expired"` \| `"excluded"` \| `"removed"` \| `"internal"` \| `"unattributed"`

---

### persistence?

> `optional` **persistence?**: [`ProxyStatsPersistenceStatus`](ProxyStatsPersistenceStatus.md)

Defined in: [types/proxy.ts:3261](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3261)
