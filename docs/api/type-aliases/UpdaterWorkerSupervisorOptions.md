[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / UpdaterWorkerSupervisorOptions

# Type Alias: UpdaterWorkerSupervisorOptions

> **UpdaterWorkerSupervisorOptions** = `object`

Defined in: [types/proxy.ts:2790](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2790)

Dependencies and callbacks used to supervise the updater worker process.

## Properties

### spawnWorker

> **spawnWorker**: () => `number` \| `undefined`

Defined in: [types/proxy.ts:2791](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2791)

#### Returns

`number` \| `undefined`

---

### isProcessRunning

> **isProcessRunning**: (`pid`) => `boolean`

Defined in: [types/proxy.ts:2792](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2792)

#### Parameters

##### pid

`number`

#### Returns

`boolean`

---

### stopWorker

> **stopWorker**: (`pid`) => `void`

Defined in: [types/proxy.ts:2793](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2793)

#### Parameters

##### pid

`number`

#### Returns

`void`

---

### onPidChange?

> `optional` **onPidChange?**: (`pid`) => `void`

Defined in: [types/proxy.ts:2794](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2794)

#### Parameters

##### pid

`number` \| `undefined`

#### Returns

`void`

---

### log?

> `optional` **log?**: (`message`) => `void`

Defined in: [types/proxy.ts:2795](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2795)

#### Parameters

##### message

`string`

#### Returns

`void`

---

### intervalMs?

> `optional` **intervalMs?**: `number`

Defined in: [types/proxy.ts:2796](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2796)
