[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / QueuedProxyLifecycleEvent

# Type Alias: QueuedProxyLifecycleEvent

> **QueuedProxyLifecycleEvent** = `object`

Defined in: [types/proxy.ts:2045](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2045)

Serialized lifecycle line awaiting a bounded batch write.

## Properties

### filePrefix?

> `optional` **filePrefix?**: `string`

Defined in: [types/proxy.ts:2046](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2046)

---

### logDir

> **logDir**: `string`

Defined in: [types/proxy.ts:2047](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2047)

---

### date

> **date**: `string`

Defined in: [types/proxy.ts:2048](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2048)

---

### record

> **record**: `Record`\<`string`, `unknown`\>

Defined in: [types/proxy.ts:2049](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2049)

---

### writeRetries

> **writeRetries**: `number`

Defined in: [types/proxy.ts:2050](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2050)

---

### onPersisted?

> `optional` **onPersisted?**: (`confirmed`) => `void`

Defined in: [types/proxy.ts:2052](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2052)

Resolve only after the original append settles; uncertain writes fail.

#### Parameters

##### confirmed

`boolean`

#### Returns

`void`
