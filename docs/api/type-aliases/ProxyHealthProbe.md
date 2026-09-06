[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyHealthProbe

# Type Alias: ProxyHealthProbe

> **ProxyHealthProbe** = `object`

Defined in: [types/proxy.ts:2645](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2645)

Result of one local proxy health probe by the updater or fail-open guard.

## Properties

### healthy

> **healthy**: `boolean`

Defined in: [types/proxy.ts:2646](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2646)

---

### durationMs

> **durationMs**: `number`

Defined in: [types/proxy.ts:2647](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2647)

---

### failure

> **failure**: `"http_status"` \| `"network"` \| `"timeout"` \| `null`

Defined in: [types/proxy.ts:2648](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2648)

---

### statusCode

> **statusCode**: `number` \| `null`

Defined in: [types/proxy.ts:2649](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2649)

---

### errorCode

> **errorCode**: `string` \| `null`

Defined in: [types/proxy.ts:2650](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2650)
