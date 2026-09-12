[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RuntimeAccountState

# Type Alias: RuntimeAccountState

> **RuntimeAccountState** = `object`

Defined in: [types/proxy.ts:1617](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1617)

Runtime state for a proxy account.

## Properties

### consecutiveRefreshFailures

> **consecutiveRefreshFailures**: `number`

Defined in: [types/proxy.ts:1618](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1618)

---

### permanentlyDisabled

> **permanentlyDisabled**: `boolean`

Defined in: [types/proxy.ts:1619](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1619)

---

### lastToken?

> `optional` **lastToken?**: `string`

Defined in: [types/proxy.ts:1620](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1620)

---

### lastRefreshToken?

> `optional` **lastRefreshToken?**: `string`

Defined in: [types/proxy.ts:1621](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1621)

---

### coolingUntil?

> `optional` **coolingUntil?**: `number`

Defined in: [types/proxy.ts:1626](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1626)

Epoch-ms timestamp until which the account should not be used for new
requests. Set from the actual Anthropic reset/retry window or from
bounded refresh backoff. Other requests arriving during this window skip
the account rather than hammering it.

---

### coolingReason?

> `optional` **coolingReason?**: [`AccountCoolingReason`](AccountCoolingReason.md)

Defined in: [types/proxy.ts:1628](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1628)

Why the account is cooling (set alongside coolingUntil).

---

### quota?

> `optional` **quota?**: [`AccountQuota`](AccountQuota.md)

Defined in: [types/proxy.ts:1632](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1632)

Latest quota snapshot parsed from Anthropic `anthropic-ratelimit-unified-*`
headers on ANY response (success or 429). Drives proactive, reset-aware
selection so we don't have to eat a 429 to discover an account is spent.
