[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingWorkerHandle

# Type Alias: RollingWorkerHandle

> **RollingWorkerHandle** = `object`

Defined in: [types/proxy.ts:2817](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2817)

## Properties

### pid

> **pid**: `number`

Defined in: [types/proxy.ts:2818](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2818)

---

### sendControl

> **sendControl**: (`message`) => `void`

Defined in: [types/proxy.ts:2819](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2819)

#### Parameters

##### message

[`ProxyWorkerControlMessage`](ProxyWorkerControlMessage.md)

#### Returns

`void`

---

### sendSocket

> **sendSocket**: (`generation`, `socket`, `callback`) => `void`

Defined in: [types/proxy.ts:2820](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2820)

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

Defined in: [types/proxy.ts:2825](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2825)

#### Parameters

##### signal?

`NodeJS.Signals`

#### Returns

`void`

---

### onMessage

> **onMessage**: (`listener`) => () => `void`

Defined in: [types/proxy.ts:2826](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2826)

#### Parameters

##### listener

(`message`) => `void`

#### Returns

() => `void`

---

### onExit

> **onExit**: (`listener`) => () => `void`

Defined in: [types/proxy.ts:2829](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2829)

#### Parameters

##### listener

(`code`, `signal`) => `void`

#### Returns

() => `void`
