[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / StatusStats

# Type Alias: StatusStats

> **StatusStats** = `object`

Defined in: [types/proxy.ts:3301](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3301)

Stats shape consumed by the proxy status printer.

## Properties

### startedAt?

> `optional` **startedAt?**: `number`

Defined in: [types/proxy.ts:3302](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3302)

---

### totalAttempts?

> `optional` **totalAttempts?**: `number`

Defined in: [types/proxy.ts:3303](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3303)

---

### totalAttemptErrors?

> `optional` **totalAttemptErrors?**: `number`

Defined in: [types/proxy.ts:3304](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3304)

---

### totalRequests

> **totalRequests**: `number`

Defined in: [types/proxy.ts:3305](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3305)

---

### totalSuccess

> **totalSuccess**: `number`

Defined in: [types/proxy.ts:3306](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3306)

---

### totalErrors

> **totalErrors**: `number`

Defined in: [types/proxy.ts:3307](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3307)

---

### totalRateLimits

> **totalRateLimits**: `number`

Defined in: [types/proxy.ts:3308](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3308)

---

### totalTransientRateLimits?

> `optional` **totalTransientRateLimits?**: `number`

Defined in: [types/proxy.ts:3309](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3309)

---

### totalQuotaRateLimits?

> `optional` **totalQuotaRateLimits?**: `number`

Defined in: [types/proxy.ts:3310](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3310)

---

### terminalErrors?

> `optional` **terminalErrors?**: [`ProxyTerminalErrorJournal`](ProxyTerminalErrorJournal.md)

Defined in: [types/proxy.ts:3311](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3311)

---

### lastTerminalError?

> `optional` **lastTerminalError?**: [`ProxyTerminalErrorSummary`](ProxyTerminalErrorSummary.md) \| `null`

Defined in: [types/proxy.ts:3312](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3312)

---

### terminalErrorDetailsComparable?

> `optional` **terminalErrorDetailsComparable?**: `boolean`

Defined in: [types/proxy.ts:3313](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3313)

---

### terminalErrorDetailsMissing?

> `optional` **terminalErrorDetailsMissing?**: `number`

Defined in: [types/proxy.ts:3314](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3314)

---

### terminalErrorDetailsExcess?

> `optional` **terminalErrorDetailsExcess?**: `number`

Defined in: [types/proxy.ts:3315](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3315)

---

### snapshotSource?

> `optional` **snapshotSource?**: `"reconciled"` \| `"memory"`

Defined in: [types/proxy.ts:3317](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3317)

Whether this status response reconciled shared state or used local memory.

---

### accounts?

> `optional` **accounts?**: `object`[]

Defined in: [types/proxy.ts:3318](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3318)

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

Defined in: [types/proxy.ts:3345](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3345)
