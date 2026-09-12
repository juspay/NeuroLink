[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyReadinessState

# Type Alias: ProxyReadinessState

> **ProxyReadinessState** = `object`

Defined in: [types/proxy.ts:1727](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1727)

Mutable readiness state tracked by the proxy process.

## Properties

### startTimeMs

> **startTimeMs**: `number`

Defined in: [types/proxy.ts:1728](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1728)

---

### acceptingConnections

> **acceptingConnections**: `boolean`

Defined in: [types/proxy.ts:1729](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1729)

---

### ready

> **ready**: `boolean`

Defined in: [types/proxy.ts:1730](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1730)

---

### drainingForUpdate

> **drainingForUpdate**: `boolean`

Defined in: [types/proxy.ts:1732](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1732)

True only while the updater is draining inference traffic.

---

### readyAtMs?

> `optional` **readyAtMs?**: `number`

Defined in: [types/proxy.ts:1733](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1733)
