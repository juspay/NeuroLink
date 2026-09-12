[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingProxyServer

# Type Alias: RollingProxyServer

> **RollingProxyServer** = `object`

Defined in: [types/proxy.ts:3014](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3014)

## Properties

### address

> **address**: `object`

Defined in: [types/proxy.ts:3015](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3015)

#### host

> **host**: `string`

#### port

> **port**: `number`

---

### replace

> **replace**: (`expectedVersion`) => `Promise`\<[`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)\>

Defined in: [types/proxy.ts:3016](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3016)

#### Parameters

##### expectedVersion

`string`

#### Returns

`Promise`\<[`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)\>

---

### snapshot

> **snapshot**: () => [`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)

Defined in: [types/proxy.ts:3019](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3019)

#### Returns

[`RollingWorkerSupervisorSnapshot`](RollingWorkerSupervisorSnapshot.md)

---

### close

> **close**: () => `Promise`\<`void`\>

Defined in: [types/proxy.ts:3020](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3020)

#### Returns

`Promise`\<`void`\>
