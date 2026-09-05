[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingProxyServer

# Type Alias: RollingProxyServer

> **RollingProxyServer** = `object`

Defined in: [types/proxy.ts:2930](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2930)

## Properties

### address

> **address**: `object`

Defined in: [types/proxy.ts:2931](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2931)

#### host

> **host**: `string`

#### port

> **port**: `number`

---

### replace

> **replace**: (`expectedVersion`) => `Promise`\<[`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)\>

Defined in: [types/proxy.ts:2932](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2932)

#### Parameters

##### expectedVersion

`string`

#### Returns

`Promise`\<[`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)\>

---

### snapshot

> **snapshot**: () => [`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)

Defined in: [types/proxy.ts:2935](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2935)

#### Returns

[`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)

---

### close

> **close**: () => `Promise`\<`void`\>

Defined in: [types/proxy.ts:2936](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2936)

#### Returns

`Promise`\<`void`\>
