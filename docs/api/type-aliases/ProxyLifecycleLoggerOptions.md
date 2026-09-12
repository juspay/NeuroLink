[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLifecycleLoggerOptions

# Type Alias: ProxyLifecycleLoggerOptions

> **ProxyLifecycleLoggerOptions** = `object`

Defined in: [types/proxy.ts:2039](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2039)

Lifecycle logger configuration. Queue overrides are used by stress tests.

## Properties

### filePrefix?

> `optional` **filePrefix?**: `"proxy-lifecycle"` \| `"proxy-supervisor"`

Defined in: [types/proxy.ts:2040](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2040)

---

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:2041](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2041)

---

### logDir?

> `optional` **logDir?**: `string`

Defined in: [types/proxy.ts:2042](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2042)

---

### queueCapacity?

> `optional` **queueCapacity?**: `number`

Defined in: [types/proxy.ts:2043](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2043)

---

### batchSize?

> `optional` **batchSize?**: `number`

Defined in: [types/proxy.ts:2044](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2044)

---

### flushIntervalMs?

> `optional` **flushIntervalMs?**: `number`

Defined in: [types/proxy.ts:2045](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2045)

---

### maxWriteRetries?

> `optional` **maxWriteRetries?**: `number`

Defined in: [types/proxy.ts:2047](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2047)

Bounded retries for a metadata batch that cannot be appended immediately.
