[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ValidateInstalledVersionOptions

# Type Alias: ValidateInstalledVersionOptions

> **ValidateInstalledVersionOptions** = `object`

Defined in: [types/proxy.ts:2715](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2715)

Options for validating a newly installed CLI through its stable executable.

## Properties

### binPath

> **binPath**: `string`

Defined in: [types/proxy.ts:2716](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2716)

---

### expectedVersion

> **expectedVersion**: `string`

Defined in: [types/proxy.ts:2717](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2717)

---

### maxAttempts?

> `optional` **maxAttempts?**: `number`

Defined in: [types/proxy.ts:2718](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2718)

---

### delayMs?

> `optional` **delayMs?**: `number`

Defined in: [types/proxy.ts:2719](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2719)

---

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: [types/proxy.ts:2720](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2720)

---

### execFileSync?

> `optional` **execFileSync?**: [`GlobalInstallerExecFile`](GlobalInstallerExecFile.md)

Defined in: [types/proxy.ts:2721](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2721)

---

### sleep?

> `optional` **sleep?**: (`ms`) => `Promise`\<`void`\>

Defined in: [types/proxy.ts:2722](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2722)

#### Parameters

##### ms

`number`

#### Returns

`Promise`\<`void`\>
