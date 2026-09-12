[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CompareProxyReplayOptions

# Type Alias: CompareProxyReplayOptions

> **CompareProxyReplayOptions** = `object`

Defined in: [types/proxy.ts:2516](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2516)

Inputs for an explicitly authorized direct-upstream comparison.

## Properties

### execute

> **execute**: `boolean`

Defined in: [types/proxy.ts:2517](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2517)

---

### headerValues?

> `optional` **headerValues?**: `Record`\<`string`, `string`\>

Defined in: [types/proxy.ts:2518](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2518)

---

### bodyOverride?

> `optional` **bodyOverride?**: `string`

Defined in: [types/proxy.ts:2519](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2519)

---

### urlOverride?

> `optional` **urlOverride?**: `string`

Defined in: [types/proxy.ts:2520](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2520)

---

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: [types/proxy.ts:2521](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2521)

---

### now?

> `optional` **now?**: () => `number`

Defined in: [types/proxy.ts:2522](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2522)

#### Returns

`number`

---

### fetchImpl?

> `optional` **fetchImpl?**: _typeof_ `fetch`

Defined in: [types/proxy.ts:2523](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2523)
