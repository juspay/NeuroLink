[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyUpdateWindowOptions

# Type Alias: ProxyUpdateWindowOptions

> **ProxyUpdateWindowOptions** = `object`

Defined in: [types/proxy.ts:2656](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2656)

Dependencies and timing controls for the updater's safe-window coordinator.

## Properties

### quietThresholdMs

> **quietThresholdMs**: `number`

Defined in: [types/proxy.ts:2657](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2657)

---

### quietWaitMs

> **quietWaitMs**: `number`

Defined in: [types/proxy.ts:2658](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2658)

---

### drainWaitMs

> **drainWaitMs**: `number`

Defined in: [types/proxy.ts:2659](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2659)

---

### pollIntervalMs

> **pollIntervalMs**: `number`

Defined in: [types/proxy.ts:2660](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2660)

---

### getActivity

> **getActivity**: () => `Promise`\<[`ProxyRuntimeActivity`](ProxyRuntimeActivity.md) \| `null`\>

Defined in: [types/proxy.ts:2661](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2661)

#### Returns

`Promise`\<[`ProxyRuntimeActivity`](ProxyRuntimeActivity.md) \| `null`\>

---

### setDraining

> **setDraining**: (`draining`) => `Promise`\<`boolean`\>

Defined in: [types/proxy.ts:2662](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2662)

#### Parameters

##### draining

`boolean`

#### Returns

`Promise`\<`boolean`\>

---

### isStopping

> **isStopping**: () => `boolean`

Defined in: [types/proxy.ts:2663](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2663)

#### Returns

`boolean`

---

### isParentAlive

> **isParentAlive**: () => `boolean`

Defined in: [types/proxy.ts:2664](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2664)

#### Returns

`boolean`

---

### onPhase?

> `optional` **onPhase?**: (`phase`, `activity`) => `void`

Defined in: [types/proxy.ts:2665](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2665)

#### Parameters

##### phase

`"waiting_for_quiet"` \| `"draining"` \| `"drain_timeout"`

##### activity

[`ProxyRuntimeActivity`](ProxyRuntimeActivity.md) \| `null`

#### Returns

`void`

---

### now?

> `optional` **now?**: () => `number`

Defined in: [types/proxy.ts:2669](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2669)

#### Returns

`number`

---

### sleep?

> `optional` **sleep?**: (`ms`) => `Promise`\<`void`\>

Defined in: [types/proxy.ts:2670](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2670)

#### Parameters

##### ms

`number`

#### Returns

`Promise`\<`void`\>
