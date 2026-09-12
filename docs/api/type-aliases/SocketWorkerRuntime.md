[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SocketWorkerRuntime

# Type Alias: SocketWorkerRuntime

> **SocketWorkerRuntime** = `object`

Defined in: [types/proxy.ts:3043](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3043)

## Properties

### acceptSocket

> **acceptSocket**: (`socket`) => `void`

Defined in: [types/proxy.ts:3044](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3044)

#### Parameters

##### socket

[`TransferableProxySocket`](TransferableProxySocket.md)

#### Returns

`void`

---

### drain

> **drain**: () => `void`

Defined in: [types/proxy.ts:3045](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3045)

#### Returns

`void`

---

### close

> **close**: () => `void`

Defined in: [types/proxy.ts:3046](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3046)

#### Returns

`void`

---

### snapshot

> **snapshot**: () => `object`

Defined in: [types/proxy.ts:3047](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3047)

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
