[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / QueuedProxyLifecycleEvent

# Type Alias: QueuedProxyLifecycleEvent

> **QueuedProxyLifecycleEvent** = `object`

Defined in: [types/proxy.ts:2051](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2051)

Serialized lifecycle line awaiting a bounded batch write.

## Properties

### filePrefix?

> `optional` **filePrefix?**: `string`

Defined in: [types/proxy.ts:2052](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2052)

---

### logDir

> **logDir**: `string`

Defined in: [types/proxy.ts:2053](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2053)

---

### date

> **date**: `string`

Defined in: [types/proxy.ts:2054](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2054)

---

### record

> **record**: `Record`\<`string`, `unknown`\>

Defined in: [types/proxy.ts:2055](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2055)

---

### writeRetries

> **writeRetries**: `number`

Defined in: [types/proxy.ts:2056](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2056)

---

### onPersisted?

> `optional` **onPersisted?**: (`confirmed`) => `void`

Defined in: [types/proxy.ts:2058](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2058)

Resolve only after the original append settles; uncertain writes fail.

#### Parameters

##### confirmed

`boolean`

#### Returns

`void`
