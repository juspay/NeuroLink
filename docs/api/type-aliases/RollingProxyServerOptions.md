[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingProxyServerOptions

# Type Alias: RollingProxyServerOptions

> **RollingProxyServerOptions** = `object`

Defined in: [types/proxy.ts:2994](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2994)

## Properties

### host

> **host**: `string`

Defined in: [types/proxy.ts:2995](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2995)

---

### port

> **port**: `number`

Defined in: [types/proxy.ts:2996](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2996)

---

### initialVersion

> **initialVersion**: `string`

Defined in: [types/proxy.ts:2997](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2997)

---

### spawnWorker

> **spawnWorker**: (`generation`, `expectedVersion`) => [`RollingWorkerHandle`](RollingWorkerHandle.md)

Defined in: [types/proxy.ts:2998](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2998)

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

Defined in: [types/proxy.ts:3002](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3002)

---

### socketQueueLimit?

> `optional` **socketQueueLimit?**: `number`

Defined in: [types/proxy.ts:3003](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3003)

---

### maxPendingTransfers?

> `optional` **maxPendingTransfers?**: `number`

Defined in: [types/proxy.ts:3004](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3004)

---

### socketQueueTimeoutMs?

> `optional` **socketQueueTimeoutMs?**: `number`

Defined in: [types/proxy.ts:3005](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3005)

---

### shutdownTimeoutMs?

> `optional` **shutdownTimeoutMs?**: `number`

Defined in: [types/proxy.ts:3006](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3006)

---

### recoveryDelayMs?

> `optional` **recoveryDelayMs?**: `number`

Defined in: [types/proxy.ts:3007](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3007)

---

### maxRecoveryDelayMs?

> `optional` **maxRecoveryDelayMs?**: `number`

Defined in: [types/proxy.ts:3008](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3008)

---

### onStateChange?

> `optional` **onStateChange?**: (`snapshot`) => `void`

Defined in: [types/proxy.ts:3009](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3009)

#### Parameters

##### snapshot

[`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)

#### Returns

`void`

---

### onEvent?

> `optional` **onEvent?**: (`event`) => `void`

Defined in: [types/proxy.ts:3010](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3010)

#### Parameters

##### event

[`RollingWorkerSupervisorEvent`](RollingWorkerSupervisorEvent.md)

#### Returns

`void`

---

### log?

> `optional` **log?**: (`message`) => `void`

Defined in: [types/proxy.ts:3011](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3011)

#### Parameters

##### message

`string`

#### Returns

`void`
