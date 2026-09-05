[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SocketWorkerRuntime

# Type Alias: SocketWorkerRuntime

> **SocketWorkerRuntime** = `object`

Defined in: [types/proxy.ts:2959](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2959)

## Properties

### acceptSocket

> **acceptSocket**: (`socket`) => `void`

Defined in: [types/proxy.ts:2960](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2960)

#### Parameters

##### socket

[`TransferableProxySocket`](TransferableProxySocket.md)

#### Returns

`void`

---

### drain

> **drain**: () => `void`

Defined in: [types/proxy.ts:2961](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2961)

#### Returns

`void`

---

### close

> **close**: () => `void`

Defined in: [types/proxy.ts:2962](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2962)

#### Returns

`void`

---

### snapshot

> **snapshot**: () => `object`

Defined in: [types/proxy.ts:2963](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2963)

#### Returns

`object`

##### draining

> **draining**: `boolean`

##### sockets

> **sockets**: `number`

##### activeRequests

> **activeRequests**: `number`

##### drained

> **drained**: `boolean`
