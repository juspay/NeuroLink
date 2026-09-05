[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLifecycleLoggerOptions

# Type Alias: ProxyLifecycleLoggerOptions

> **ProxyLifecycleLoggerOptions** = `object`

Defined in: [types/proxy.ts:1997](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1997)

Lifecycle logger configuration. Queue overrides are used by stress tests.

## Properties

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:1998](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1998)

---

### logDir?

> `optional` **logDir?**: `string`

Defined in: [types/proxy.ts:1999](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1999)

---

### queueCapacity?

> `optional` **queueCapacity?**: `number`

Defined in: [types/proxy.ts:2000](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2000)

---

### batchSize?

> `optional` **batchSize?**: `number`

Defined in: [types/proxy.ts:2001](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2001)

---

### flushIntervalMs?

> `optional` **flushIntervalMs?**: `number`

Defined in: [types/proxy.ts:2002](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2002)

---

### maxWriteRetries?

> `optional` **maxWriteRetries?**: `number`

Defined in: [types/proxy.ts:2004](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2004)

Bounded retries for a metadata batch that cannot be appended immediately.
