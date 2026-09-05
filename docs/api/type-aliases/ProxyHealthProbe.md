[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyHealthProbe

# Type Alias: ProxyHealthProbe

> **ProxyHealthProbe** = `object`

Defined in: [types/proxy.ts:2587](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2587)

Result of one local proxy health probe by the updater or fail-open guard.

## Properties

### healthy

> **healthy**: `boolean`

Defined in: [types/proxy.ts:2588](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2588)

---

### durationMs

> **durationMs**: `number`

Defined in: [types/proxy.ts:2589](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2589)

---

### failure

> **failure**: `"http_status"` \| `"network"` \| `"timeout"` \| `null`

Defined in: [types/proxy.ts:2590](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2590)

---

### statusCode

> **statusCode**: `number` \| `null`

Defined in: [types/proxy.ts:2591](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2591)

---

### errorCode

> **errorCode**: `string` \| `null`

Defined in: [types/proxy.ts:2592](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2592)
