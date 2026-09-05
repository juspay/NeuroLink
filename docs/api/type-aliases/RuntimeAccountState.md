[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RuntimeAccountState

# Type Alias: RuntimeAccountState

> **RuntimeAccountState** = `object`

Defined in: [types/proxy.ts:1594](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1594)

Runtime state for a proxy account.

## Properties

### consecutiveRefreshFailures

> **consecutiveRefreshFailures**: `number`

Defined in: [types/proxy.ts:1595](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1595)

---

### permanentlyDisabled

> **permanentlyDisabled**: `boolean`

Defined in: [types/proxy.ts:1596](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1596)

---

### lastToken?

> `optional` **lastToken?**: `string`

Defined in: [types/proxy.ts:1597](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1597)

---

### lastRefreshToken?

> `optional` **lastRefreshToken?**: `string`

Defined in: [types/proxy.ts:1598](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1598)

---

### coolingUntil?

> `optional` **coolingUntil?**: `number`

Defined in: [types/proxy.ts:1603](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1603)

Epoch-ms timestamp until which the account should not be used for new
requests. Set from the actual Anthropic reset/retry window or from
bounded refresh backoff. Other requests arriving during this window skip
the account rather than hammering it.

---

### coolingReason?

> `optional` **coolingReason?**: [`AccountCoolingReason`](AccountCoolingReason.md)

Defined in: [types/proxy.ts:1605](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1605)

Why the account is cooling (set alongside coolingUntil).

---

### quota?

> `optional` **quota?**: [`AccountQuota`](AccountQuota.md)

Defined in: [types/proxy.ts:1609](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1609)

Latest quota snapshot parsed from Anthropic `anthropic-ratelimit-unified-*`
headers on ANY response (success or 429). Drives proactive, reset-aware
selection so we don't have to eat a 429 to discover an account is spent.
