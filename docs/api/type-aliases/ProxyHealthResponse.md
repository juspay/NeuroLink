[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyHealthResponse

# Type Alias: ProxyHealthResponse

> **ProxyHealthResponse** = `object`

Defined in: [types/proxy.ts:1714](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1714)

Structured response returned by the proxy /health endpoint.

## Properties

### status

> **status**: `"ok"` \| `"starting"`

Defined in: [types/proxy.ts:1715](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1715)

---

### ready

> **ready**: `boolean`

Defined in: [types/proxy.ts:1716](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1716)

---

### acceptingConnections

> **acceptingConnections**: `boolean`

Defined in: [types/proxy.ts:1717](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1717)

---

### drainingForUpdate

> **drainingForUpdate**: `boolean`

Defined in: [types/proxy.ts:1718](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1718)

---

### strategy

> **strategy**: `string`

Defined in: [types/proxy.ts:1719](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1719)

---

### passthrough

> **passthrough**: `boolean`

Defined in: [types/proxy.ts:1720](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1720)

---

### version

> **version**: `string`

Defined in: [types/proxy.ts:1721](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1721)

---

### startedAt

> **startedAt**: `string`

Defined in: [types/proxy.ts:1722](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1722)

---

### readyAt

> **readyAt**: `string` \| `null`

Defined in: [types/proxy.ts:1723](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1723)

---

### uptime

> **uptime**: `number`

Defined in: [types/proxy.ts:1724](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1724)

---

### healthPath

> **healthPath**: `"/health"`

Defined in: [types/proxy.ts:1725](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1725)

---

### statusPath

> **statusPath**: `"/status"`

Defined in: [types/proxy.ts:1726](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1726)
