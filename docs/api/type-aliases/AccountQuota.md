[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AccountQuota

# Type Alias: AccountQuota

> **AccountQuota** = `object`

Defined in: [types/proxy.ts:1314](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1314)

## Properties

### unifiedStatus?

> `optional` **unifiedStatus?**: `string`

Defined in: [types/proxy.ts:1317](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1317)

Top-level unified status. A rejected value can be authoritative even
while both 5h and 7d sub-window statuses still report allowed.

---

### sessionUsed

> **sessionUsed**: `number`

Defined in: [types/proxy.ts:1319](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1319)

0.0-1.0 (from unified-5h-utilization)

---

### sessionStatus

> **sessionStatus**: `string`

Defined in: [types/proxy.ts:1321](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1321)

"allowed" | "throttled" | "rejected"

---

### sessionResetAt

> **sessionResetAt**: `number`

Defined in: [types/proxy.ts:1323](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1323)

Unix timestamp (seconds) when the 5h window resets

---

### weeklyUsed

> **weeklyUsed**: `number`

Defined in: [types/proxy.ts:1325](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1325)

0.0-1.0 (from unified-7d-utilization)

---

### weeklyStatus

> **weeklyStatus**: `string`

Defined in: [types/proxy.ts:1327](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1327)

"allowed" | "throttled" | "rejected"

---

### weeklyResetAt

> **weeklyResetAt**: `number`

Defined in: [types/proxy.ts:1329](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1329)

Unix timestamp (seconds) when the 7d window resets

---

### fallbackPercentage

> **fallbackPercentage**: `number`

Defined in: [types/proxy.ts:1331](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1331)

0.0-1.0 (from fallback-percentage)

---

### fallbackStatus?

> `optional` **fallbackStatus?**: `string`

Defined in: [types/proxy.ts:1333](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1333)

Provider fallback availability, for example "available".

---

### upgradePaths?

> `optional` **upgradePaths?**: `string`

Defined in: [types/proxy.ts:1335](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1335)

Comma-separated provider upgrade paths, for example "overage".

---

### overageStatus

> **overageStatus**: `string`

Defined in: [types/proxy.ts:1337](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1337)

"allowed" | "rejected"

---

### overageInUse?

> `optional` **overageInUse?**: `boolean`

Defined in: [types/proxy.ts:1339](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1339)

Whether Anthropic reports that paid overage is actively serving traffic.

---

### overageDisabledReason?

> `optional` **overageDisabledReason?**: `string`

Defined in: [types/proxy.ts:1343](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1343)

Why overage is unavailable, verbatim from
anthropic-ratelimit-unified-overage-disabled-reason (e.g.
"org_level_disabled"). Present only when the provider states one.

---

### overageEnabled?

> `optional` **overageEnabled?**: `boolean`

Defined in: [types/proxy.ts:1347](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1347)

Authoritative extra-usage switch from the usage API's
`extra_usage.is_enabled`. Unlike the header trio this is reported even for
an account that has never served a request.

---

### representativeClaim?

> `optional` **representativeClaim?**: `string`

Defined in: [types/proxy.ts:1350](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1350)

Which window Anthropic considers binding right now, verbatim from
anthropic-ratelimit-unified-representative-claim (e.g. "five_hour").

---

### lastUpdated

> **lastUpdated**: `number`

Defined in: [types/proxy.ts:1352](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1352)

Epoch ms when we last captured this data

---

### windows?

> `optional` **windows?**: [`AccountQuotaWindow`](AccountQuotaWindow.md)[]

Defined in: [types/proxy.ts:1356](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1356)

Dynamic per-plan limit buckets from the usage API `limits[]` array
(session / weekly_all / model-scoped weeklies such as Fable / future
kinds). Absent on purely header-sourced snapshots.

---

### windowsUpdatedAt?

> `optional` **windowsUpdatedAt?**: `number`

Defined in: [types/proxy.ts:1358](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1358)

Epoch ms when `windows` was last refreshed from the usage API.

---

### source?

> `optional` **source?**: [`AccountQuotaSource`](AccountQuotaSource.md)

Defined in: [types/proxy.ts:1360](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1360)

Provenance of this snapshot's numbers.
