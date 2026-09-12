[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyHealthProbe

# Type Alias: ProxyHealthProbe

> **ProxyHealthProbe** = `object`

Defined in: [types/proxy.ts:2651](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2651)

Result of one local proxy health probe by the updater or fail-open guard.

## Properties

### healthy

> **healthy**: `boolean`

Defined in: [types/proxy.ts:2652](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2652)

---

### durationMs

> **durationMs**: `number`

Defined in: [types/proxy.ts:2653](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2653)

---

### failure

> **failure**: `"http_status"` \| `"network"` \| `"timeout"` \| `null`

Defined in: [types/proxy.ts:2654](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2654)

---

### statusCode

> **statusCode**: `number` \| `null`

Defined in: [types/proxy.ts:2655](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2655)

---

### errorCode

> **errorCode**: `string` \| `null`

Defined in: [types/proxy.ts:2656](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2656)
