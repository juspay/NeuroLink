[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyUpdateWindowOptions

# Type Alias: ProxyUpdateWindowOptions

> **ProxyUpdateWindowOptions** = `object`

Defined in: [types/proxy.ts:2720](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2720)

Dependencies and timing controls for the updater's safe-window coordinator.

## Properties

### quietThresholdMs

> **quietThresholdMs**: `number`

Defined in: [types/proxy.ts:2721](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2721)

---

### quietWaitMs

> **quietWaitMs**: `number`

Defined in: [types/proxy.ts:2722](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2722)

---

### drainWaitMs

> **drainWaitMs**: `number`

Defined in: [types/proxy.ts:2723](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2723)

---

### pollIntervalMs

> **pollIntervalMs**: `number`

Defined in: [types/proxy.ts:2724](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2724)

---

### getActivity

> **getActivity**: () => `Promise`\<[`ProxyRuntimeActivity`](ProxyRuntimeActivity.md) \| `null`\>

Defined in: [types/proxy.ts:2725](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2725)

#### Returns

`Promise`\<[`ProxyRuntimeActivity`](ProxyRuntimeActivity.md) \| `null`\>

---

### setDraining

> **setDraining**: (`draining`) => `Promise`\<`boolean`\>

Defined in: [types/proxy.ts:2726](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2726)

#### Parameters

##### draining

`boolean`

#### Returns

`Promise`\<`boolean`\>

---

### isStopping

> **isStopping**: () => `boolean`

Defined in: [types/proxy.ts:2727](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2727)

#### Returns

`boolean`

---

### isParentAlive

> **isParentAlive**: () => `boolean`

Defined in: [types/proxy.ts:2728](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2728)

#### Returns

`boolean`

---

### onPhase?

> `optional` **onPhase?**: (`phase`, `activity`) => `void`

Defined in: [types/proxy.ts:2729](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2729)

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

Defined in: [types/proxy.ts:2733](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2733)

#### Returns

`number`

---

### sleep?

> `optional` **sleep?**: (`ms`) => `Promise`\<`void`\>

Defined in: [types/proxy.ts:2734](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2734)

#### Parameters

##### ms

`number`

#### Returns

`Promise`\<`void`\>
