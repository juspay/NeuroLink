[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyQuotaHeaderContext

# Type Alias: ProxyQuotaHeaderContext

> **ProxyQuotaHeaderContext** = `object`

Defined in: [types/proxy.ts:1577](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1577)

Everything the proxy knows about limits and routing for one response.
Consumed by `buildQuotaResponseHeaders` — kept as data (not headers) so the
assembly stays pure and testable.

## Properties

### quota

> **quota**: [`AccountQuota`](AccountQuota.md) \| `null`

Defined in: [types/proxy.ts:1578](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1578)

---

### source

> **source**: [`ProxyQuotaSource`](ProxyQuotaSource.md)

Defined in: [types/proxy.ts:1579](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1579)

---

### accountLabel?

> `optional` **accountLabel?**: `string`

Defined in: [types/proxy.ts:1581](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1581)

Account label that served the request; omitted for fallback/no-account.

---

### accountType?

> `optional` **accountType?**: `string`

Defined in: [types/proxy.ts:1582](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1582)

---

### servedBy?

> `optional` **servedBy?**: `string`

Defined in: [types/proxy.ts:1585](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1585)

Which upstream actually produced the response ("anthropic" or a fallback
provider name). Lets a consumer avoid attributing quota to the wrong one.

---

### attempt?

> `optional` **attempt?**: `number`

Defined in: [types/proxy.ts:1587](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1587)

1-based attempt index within the routing loop.

---

### coolingUntil?

> `optional` **coolingUntil?**: `number`

Defined in: [types/proxy.ts:1589](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1589)

Epoch ms until which the serving account is cooling, when applicable.

---

### coolingReason?

> `optional` **coolingReason?**: [`AccountCoolingReason`](AccountCoolingReason.md)

Defined in: [types/proxy.ts:1590](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1590)

---

### pool?

> `optional` **pool?**: [`ProxyPoolHeadroom`](ProxyPoolHeadroom.md)

Defined in: [types/proxy.ts:1591](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1591)
