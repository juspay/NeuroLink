[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AccountStats

# Type Alias: AccountStats

> **AccountStats** = `object`

Defined in: [types/proxy.ts:1173](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1173)

## Properties

### key?

> `optional` **key?**: `string`

Defined in: [types/proxy.ts:1179](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1179)

Provider-qualified account identity for rows written by current builds.
Omitted only by legacy snapshots whose bare map keys are intentionally
treated as unattributed rather than guessed at during status rendering.

---

### label

> **label**: `string`

Defined in: [types/proxy.ts:1180](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1180)

---

### type

> **type**: `string`

Defined in: [types/proxy.ts:1181](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1181)

---

### attemptCount

> **attemptCount**: `number`

Defined in: [types/proxy.ts:1182](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1182)

---

### attemptErrorCount

> **attemptErrorCount**: `number`

Defined in: [types/proxy.ts:1184](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1184)

Failed upstream attempts, including retries that later recovered.

---

### successCount

> **successCount**: `number`

Defined in: [types/proxy.ts:1186](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1186)

Final requests successfully completed by this account.

---

### errorCount

> **errorCount**: `number`

Defined in: [types/proxy.ts:1188](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1188)

Final requests that terminated as errors on this account.

---

### rateLimitCount

> **rateLimitCount**: `number`

Defined in: [types/proxy.ts:1190](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1190)

All upstream attempts that returned 429.

---

### transientRateLimitCount

> **transientRateLimitCount**: `number`

Defined in: [types/proxy.ts:1191](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1191)

---

### quotaRateLimitCount

> **quotaRateLimitCount**: `number`

Defined in: [types/proxy.ts:1192](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1192)

---

### lastAttemptAt

> **lastAttemptAt**: `number`

Defined in: [types/proxy.ts:1193](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1193)

---

### lastErrorAt?

> `optional` **lastErrorAt?**: `number`

Defined in: [types/proxy.ts:1194](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1194)
