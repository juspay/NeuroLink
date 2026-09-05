[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLimitsAccountResult

# Type Alias: ProxyLimitsAccountResult

> **ProxyLimitsAccountResult** = `object`

Defined in: [types/proxy.ts:1479](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1479)

Per-account result inside a GET /limits response.

## Properties

### account

> **account**: `string`

Defined in: [types/proxy.ts:1481](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1481)

Account label (quota-store key).

---

### key

> **key**: `string`

Defined in: [types/proxy.ts:1483](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1483)

Token-store key ("anthropic:<label>" or "codex:<label>").

---

### provider

> **provider**: [`ProxyAccountProvider`](ProxyAccountProvider.md)

Defined in: [types/proxy.ts:1489](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1489)

Which pool engine owns this login. Two logins can share a label — an
operator may use one email for both — so the key, not the label, is the
identity, and this names the engine without parsing the key's prefix.

---

### type

> **type**: [`ProxyAccountType`](ProxyAccountType.md)

Defined in: [types/proxy.ts:1490](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1490)

---

### status

> **status**: `"refreshed"` \| `"throttled"` \| `"skipped_api_key"` \| `"snapshot"` \| `"error"`

Defined in: [types/proxy.ts:1491](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1491)

---

### quota

> **quota**: [`AccountQuota`](AccountQuota.md) \| `null`

Defined in: [types/proxy.ts:1493](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1493)

Fresh quota on "refreshed"; last known snapshot otherwise (may be null).

---

### error?

> `optional` **error?**: `string`

Defined in: [types/proxy.ts:1494](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1494)

---

### coolingUntil?

> `optional` **coolingUntil?**: `number`

Defined in: [types/proxy.ts:1495](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1495)

---

### coolingReason?

> `optional` **coolingReason?**: [`AccountCoolingReason`](AccountCoolingReason.md)

Defined in: [types/proxy.ts:1496](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1496)
