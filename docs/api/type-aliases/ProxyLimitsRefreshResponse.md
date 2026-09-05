[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLimitsRefreshResponse

# Type Alias: ProxyLimitsRefreshResponse

> **ProxyLimitsRefreshResponse** = `object`

Defined in: [types/proxy.ts:1516](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1516)

Response body of the proxy's GET /limits endpoint.

## Properties

### fetchedAt

> **fetchedAt**: `number`

Defined in: [types/proxy.ts:1517](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1517)

---

### snapshot

> **snapshot**: `boolean`

Defined in: [types/proxy.ts:1519](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1519)

True when served from stored state without contacting Anthropic.

---

### results

> **results**: [`ProxyLimitsAccountResult`](ProxyLimitsAccountResult.md)[]

Defined in: [types/proxy.ts:1520](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1520)

---

### refreshMetrics?

> `optional` **refreshMetrics?**: [`ProxyQuotaRefreshMetrics`](ProxyQuotaRefreshMetrics.md)

Defined in: [types/proxy.ts:1522](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1522)

Process-local refresh activity; contains no credentials or response body.
