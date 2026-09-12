[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AccountStats

# Type Alias: AccountStats

> **AccountStats** = `object`

Defined in: [types/proxy.ts:1196](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1196)

## Properties

### key?

> `optional` **key?**: `string`

Defined in: [types/proxy.ts:1202](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1202)

Provider-qualified account identity for rows written by current builds.
Omitted only by legacy snapshots whose bare map keys are intentionally
treated as unattributed rather than guessed at during status rendering.

---

### label

> **label**: `string`

Defined in: [types/proxy.ts:1203](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1203)

---

### type

> **type**: `string`

Defined in: [types/proxy.ts:1204](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1204)

---

### attemptCount

> **attemptCount**: `number`

Defined in: [types/proxy.ts:1205](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1205)

---

### attemptErrorCount

> **attemptErrorCount**: `number`

Defined in: [types/proxy.ts:1207](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1207)

Failed upstream attempts, including retries that later recovered.

---

### successCount

> **successCount**: `number`

Defined in: [types/proxy.ts:1209](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1209)

Final requests successfully completed by this account.

---

### errorCount

> **errorCount**: `number`

Defined in: [types/proxy.ts:1211](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1211)

Final requests that terminated as errors on this account.

---

### rateLimitCount

> **rateLimitCount**: `number`

Defined in: [types/proxy.ts:1213](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1213)

All upstream attempts that returned 429.

---

### transientRateLimitCount

> **transientRateLimitCount**: `number`

Defined in: [types/proxy.ts:1214](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1214)

---

### quotaRateLimitCount

> **quotaRateLimitCount**: `number`

Defined in: [types/proxy.ts:1215](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1215)

---

### lastAttemptAt

> **lastAttemptAt**: `number`

Defined in: [types/proxy.ts:1216](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1216)

---

### lastErrorAt?

> `optional` **lastErrorAt?**: `number`

Defined in: [types/proxy.ts:1217](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1217)
