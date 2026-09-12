[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingWorkerSupervisorOptions

# Type Alias: RollingWorkerSupervisorOptions

> **RollingWorkerSupervisorOptions** = `object`

Defined in: [types/proxy.ts:2969](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2969)

## Properties

### spawnWorker

> **spawnWorker**: (`generation`, `expectedVersion`) => [`RollingWorkerHandle`](RollingWorkerHandle.md)

Defined in: [types/proxy.ts:2970](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2970)

#### Parameters

##### generation

`number`

##### expectedVersion

`string`

#### Returns

[`RollingWorkerHandle`](RollingWorkerHandle.md)

---

### readyTimeoutMs?

> `optional` **readyTimeoutMs?**: `number`

Defined in: [types/proxy.ts:2974](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2974)

---

### socketQueueLimit?

> `optional` **socketQueueLimit?**: `number`

Defined in: [types/proxy.ts:2975](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2975)

---

### maxPendingTransfers?

> `optional` **maxPendingTransfers?**: `number`

Defined in: [types/proxy.ts:2977](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2977)

Bound IPC socket offers independently of active HTTP requests.

---

### socketQueueTimeoutMs?

> `optional` **socketQueueTimeoutMs?**: `number`

Defined in: [types/proxy.ts:2978](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2978)

---

### shutdownTimeoutMs?

> `optional` **shutdownTimeoutMs?**: `number`

Defined in: [types/proxy.ts:2979](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2979)

---

### onStateChange?

> `optional` **onStateChange?**: (`snapshot`) => `void`

Defined in: [types/proxy.ts:2980](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2980)

#### Parameters

##### snapshot

[`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)

#### Returns

`void`

---

### onEvent?

> `optional` **onEvent?**: (`event`) => `void`

Defined in: [types/proxy.ts:2981](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2981)

#### Parameters

##### event

[`RollingWorkerSupervisorEvent`](RollingWorkerSupervisorEvent.md)

#### Returns

`void`

---

### onReplacementRequested?

> `optional` **onReplacementRequested?**: (`request`) => `void`

Defined in: [types/proxy.ts:2982](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2982)

#### Parameters

##### request

###### generation

`number`

###### pid

`number`

###### reason

`"environment"` \| `"socket_offer_timeout"` \| `"socket_commit_timeout"` \| `"socket_transfer_failure"`

#### Returns

`void`

---

### log?

> `optional` **log?**: (`message`) => `void`

Defined in: [types/proxy.ts:2991](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2991)

#### Parameters

##### message

`string`

#### Returns

`void`
