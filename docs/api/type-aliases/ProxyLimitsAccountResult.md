[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLimitsAccountResult

# Type Alias: ProxyLimitsAccountResult

> **ProxyLimitsAccountResult** = `object`

Defined in: [types/proxy.ts:1502](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1502)

Per-account result inside a GET /limits response.

## Properties

### account

> **account**: `string`

Defined in: [types/proxy.ts:1504](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1504)

Account label (quota-store key).

---

### key

> **key**: `string`

Defined in: [types/proxy.ts:1506](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1506)

Token-store key ("anthropic:<label>" or "codex:<label>").

---

### provider

> **provider**: [`ProxyAccountProvider`](ProxyAccountProvider.md)

Defined in: [types/proxy.ts:1512](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1512)

Which pool engine owns this login. Two logins can share a label — an
operator may use one email for both — so the key, not the label, is the
identity, and this names the engine without parsing the key's prefix.

---

### type

> **type**: [`ProxyAccountType`](ProxyAccountType.md)

Defined in: [types/proxy.ts:1513](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1513)

---

### status

> **status**: `"refreshed"` \| `"throttled"` \| `"skipped_api_key"` \| `"snapshot"` \| `"error"`

Defined in: [types/proxy.ts:1514](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1514)

---

### quota

> **quota**: [`AccountQuota`](AccountQuota.md) \| `null`

Defined in: [types/proxy.ts:1516](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1516)

Fresh quota on "refreshed"; last known snapshot otherwise (may be null).

---

### error?

> `optional` **error?**: `string`

Defined in: [types/proxy.ts:1517](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1517)

---

### coolingUntil?

> `optional` **coolingUntil?**: `number`

Defined in: [types/proxy.ts:1518](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1518)

---

### coolingReason?

> `optional` **coolingReason?**: [`AccountCoolingReason`](AccountCoolingReason.md)

Defined in: [types/proxy.ts:1519](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1519)
