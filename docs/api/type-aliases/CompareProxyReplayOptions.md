[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CompareProxyReplayOptions

# Type Alias: CompareProxyReplayOptions

> **CompareProxyReplayOptions** = `object`

Defined in: [types/proxy.ts:2452](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2452)

Inputs for an explicitly authorized direct-upstream comparison.

## Properties

### execute

> **execute**: `boolean`

Defined in: [types/proxy.ts:2453](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2453)

---

### headerValues?

> `optional` **headerValues?**: `Record`\<`string`, `string`\>

Defined in: [types/proxy.ts:2454](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2454)

---

### bodyOverride?

> `optional` **bodyOverride?**: `string`

Defined in: [types/proxy.ts:2455](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2455)

---

### urlOverride?

> `optional` **urlOverride?**: `string`

Defined in: [types/proxy.ts:2456](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2456)

---

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: [types/proxy.ts:2457](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2457)

---

### now?

> `optional` **now?**: () => `number`

Defined in: [types/proxy.ts:2458](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2458)

#### Returns

`number`

---

### fetchImpl?

> `optional` **fetchImpl?**: _typeof_ `fetch`

Defined in: [types/proxy.ts:2459](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2459)
