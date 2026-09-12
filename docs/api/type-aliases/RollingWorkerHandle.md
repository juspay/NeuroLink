[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingWorkerHandle

# Type Alias: RollingWorkerHandle

> **RollingWorkerHandle** = `object`

Defined in: [types/proxy.ts:2882](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2882)

## Properties

### pid

> **pid**: `number`

Defined in: [types/proxy.ts:2883](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2883)

---

### sendControl

> **sendControl**: (`message`) => `void`

Defined in: [types/proxy.ts:2884](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2884)

#### Parameters

##### message

[`ProxyWorkerControlMessage`](ProxyWorkerControlMessage.md)

#### Returns

`void`

---

### sendSocket

> **sendSocket**: (`generation`, `socket`, `callback`) => `void`

Defined in: [types/proxy.ts:2885](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2885)

#### Parameters

##### generation

`number`

##### socket

[`TransferableProxySocket`](TransferableProxySocket.md)

##### callback

(`error?`) => `void`

#### Returns

`void`

---

### terminate

> **terminate**: (`signal?`) => `void`

Defined in: [types/proxy.ts:2890](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2890)

#### Parameters

##### signal?

`NodeJS.Signals`

#### Returns

`void`

---

### onMessage

> **onMessage**: (`listener`) => () => `void`

Defined in: [types/proxy.ts:2891](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2891)

#### Parameters

##### listener

(`message`) => `void`

#### Returns

() => `void`

---

### onExit

> **onExit**: (`listener`) => () => `void`

Defined in: [types/proxy.ts:2894](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2894)

#### Parameters

##### listener

(`code`, `signal`) => `void`

#### Returns

() => `void`
