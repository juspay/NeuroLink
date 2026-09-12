[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyHealthResponse

# Type Alias: ProxyHealthResponse

> **ProxyHealthResponse** = `object`

Defined in: [types/proxy.ts:1737](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1737)

Structured response returned by the proxy /health endpoint.

## Properties

### status

> **status**: `"ok"` \| `"starting"`

Defined in: [types/proxy.ts:1738](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1738)

---

### ready

> **ready**: `boolean`

Defined in: [types/proxy.ts:1739](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1739)

---

### acceptingConnections

> **acceptingConnections**: `boolean`

Defined in: [types/proxy.ts:1740](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1740)

---

### drainingForUpdate

> **drainingForUpdate**: `boolean`

Defined in: [types/proxy.ts:1741](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1741)

---

### strategy

> **strategy**: `string`

Defined in: [types/proxy.ts:1742](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1742)

---

### passthrough

> **passthrough**: `boolean`

Defined in: [types/proxy.ts:1743](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1743)

---

### version

> **version**: `string`

Defined in: [types/proxy.ts:1744](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1744)

---

### startedAt

> **startedAt**: `string`

Defined in: [types/proxy.ts:1745](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1745)

---

### readyAt

> **readyAt**: `string` \| `null`

Defined in: [types/proxy.ts:1746](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1746)

---

### uptime

> **uptime**: `number`

Defined in: [types/proxy.ts:1747](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1747)

---

### healthPath

> **healthPath**: `"/health"`

Defined in: [types/proxy.ts:1748](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1748)

---

### statusPath

> **statusPath**: `"/status"`

Defined in: [types/proxy.ts:1749](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1749)
