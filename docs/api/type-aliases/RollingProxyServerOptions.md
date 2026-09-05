[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingProxyServerOptions

# Type Alias: RollingProxyServerOptions

> **RollingProxyServerOptions** = `object`

Defined in: [types/proxy.ts:2911](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2911)

## Properties

### host

> **host**: `string`

Defined in: [types/proxy.ts:2912](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2912)

---

### port

> **port**: `number`

Defined in: [types/proxy.ts:2913](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2913)

---

### initialVersion

> **initialVersion**: `string`

Defined in: [types/proxy.ts:2914](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2914)

---

### spawnWorker

> **spawnWorker**: (`generation`, `expectedVersion`) => [`RollingWorkerHandle`](RollingWorkerHandle.md)

Defined in: [types/proxy.ts:2915](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2915)

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

Defined in: [types/proxy.ts:2919](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2919)

---

### socketQueueLimit?

> `optional` **socketQueueLimit?**: `number`

Defined in: [types/proxy.ts:2920](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2920)

---

### maxPendingTransfers?

> `optional` **maxPendingTransfers?**: `number`

Defined in: [types/proxy.ts:2921](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2921)

---

### socketQueueTimeoutMs?

> `optional` **socketQueueTimeoutMs?**: `number`

Defined in: [types/proxy.ts:2922](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2922)

---

### shutdownTimeoutMs?

> `optional` **shutdownTimeoutMs?**: `number`

Defined in: [types/proxy.ts:2923](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2923)

---

### recoveryDelayMs?

> `optional` **recoveryDelayMs?**: `number`

Defined in: [types/proxy.ts:2924](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2924)

---

### maxRecoveryDelayMs?

> `optional` **maxRecoveryDelayMs?**: `number`

Defined in: [types/proxy.ts:2925](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2925)

---

### onStateChange?

> `optional` **onStateChange?**: (`snapshot`) => `void`

Defined in: [types/proxy.ts:2926](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2926)

#### Parameters

##### snapshot

[`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)

#### Returns

`void`

---

### log?

> `optional` **log?**: (`message`) => `void`

Defined in: [types/proxy.ts:2927](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2927)

#### Parameters

##### message

`string`

#### Returns

`void`
