[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyMetrics

# Type Alias: ProxyMetrics

> **ProxyMetrics** = `object`

Defined in: [types/proxy.ts:1755](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1755)

OTel metric instruments used by the proxy tracer.

## Properties

### requestsTotal

> **requestsTotal**: `Counter`

Defined in: [types/proxy.ts:1756](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1756)

---

### requestDuration

> **requestDuration**: `Histogram`

Defined in: [types/proxy.ts:1757](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1757)

---

### tokensInput

> **tokensInput**: `Counter`

Defined in: [types/proxy.ts:1758](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1758)

---

### tokensOutput

> **tokensOutput**: `Counter`

Defined in: [types/proxy.ts:1759](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1759)

---

### tokensCacheRead

> **tokensCacheRead**: `Counter`

Defined in: [types/proxy.ts:1760](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1760)

---

### tokensCacheCreation

> **tokensCacheCreation**: `Counter`

Defined in: [types/proxy.ts:1761](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1761)

---

### tokensReasoning

> **tokensReasoning**: `Counter`

Defined in: [types/proxy.ts:1762](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1762)

---

### costTotal

> **costTotal**: `Counter`

Defined in: [types/proxy.ts:1763](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1763)

---

### errorsTotal

> **errorsTotal**: `Counter`

Defined in: [types/proxy.ts:1764](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1764)

---

### retriesTotal

> **retriesTotal**: `Counter`

Defined in: [types/proxy.ts:1765](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1765)

---

### modelSubstitutionTotal

> **modelSubstitutionTotal**: `Counter`

Defined in: [types/proxy.ts:1766](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1766)

---

### requestBodySize

> **requestBodySize**: `Histogram`

Defined in: [types/proxy.ts:1767](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1767)

---

### responseBodySize

> **responseBodySize**: `Histogram`

Defined in: [types/proxy.ts:1768](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1768)

---

### fallbackAttemptsTotal

> **fallbackAttemptsTotal**: `Counter`

Defined in: [types/proxy.ts:1769](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1769)

---

### fallbackSuccessTotal

> **fallbackSuccessTotal**: `Counter`

Defined in: [types/proxy.ts:1770](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1770)

---

### fallbackFailureTotal

> **fallbackFailureTotal**: `Counter`

Defined in: [types/proxy.ts:1771](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1771)
