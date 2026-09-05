[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyReadinessState

# Type Alias: ProxyReadinessState

> **ProxyReadinessState** = `object`

Defined in: [types/proxy.ts:1704](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1704)

Mutable readiness state tracked by the proxy process.

## Properties

### startTimeMs

> **startTimeMs**: `number`

Defined in: [types/proxy.ts:1705](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1705)

---

### acceptingConnections

> **acceptingConnections**: `boolean`

Defined in: [types/proxy.ts:1706](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1706)

---

### ready

> **ready**: `boolean`

Defined in: [types/proxy.ts:1707](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1707)

---

### drainingForUpdate

> **drainingForUpdate**: `boolean`

Defined in: [types/proxy.ts:1709](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1709)

True only while the updater is draining inference traffic.

---

### readyAtMs?

> `optional` **readyAtMs?**: `number`

Defined in: [types/proxy.ts:1710](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1710)
