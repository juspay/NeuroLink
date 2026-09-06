[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLifecycleLoggerOptions

# Type Alias: ProxyLifecycleLoggerOptions

> **ProxyLifecycleLoggerOptions** = `object`

Defined in: [types/proxy.ts:2033](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2033)

Lifecycle logger configuration. Queue overrides are used by stress tests.

## Properties

### filePrefix?

> `optional` **filePrefix?**: `"proxy-lifecycle"` \| `"proxy-supervisor"`

Defined in: [types/proxy.ts:2034](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2034)

---

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:2035](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2035)

---

### logDir?

> `optional` **logDir?**: `string`

Defined in: [types/proxy.ts:2036](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2036)

---

### queueCapacity?

> `optional` **queueCapacity?**: `number`

Defined in: [types/proxy.ts:2037](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2037)

---

### batchSize?

> `optional` **batchSize?**: `number`

Defined in: [types/proxy.ts:2038](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2038)

---

### flushIntervalMs?

> `optional` **flushIntervalMs?**: `number`

Defined in: [types/proxy.ts:2039](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2039)

---

### maxWriteRetries?

> `optional` **maxWriteRetries?**: `number`

Defined in: [types/proxy.ts:2041](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2041)

Bounded retries for a metadata batch that cannot be appended immediately.
