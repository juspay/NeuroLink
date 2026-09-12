[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ValidateInstalledVersionOptions

# Type Alias: ValidateInstalledVersionOptions

> **ValidateInstalledVersionOptions** = `object`

Defined in: [types/proxy.ts:2779](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2779)

Options for validating a newly installed CLI through its stable executable.

## Properties

### binPath

> **binPath**: `string`

Defined in: [types/proxy.ts:2780](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2780)

---

### expectedVersion

> **expectedVersion**: `string`

Defined in: [types/proxy.ts:2781](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2781)

---

### maxAttempts?

> `optional` **maxAttempts?**: `number`

Defined in: [types/proxy.ts:2782](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2782)

---

### delayMs?

> `optional` **delayMs?**: `number`

Defined in: [types/proxy.ts:2783](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2783)

---

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: [types/proxy.ts:2784](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2784)

---

### execFileSync?

> `optional` **execFileSync?**: [`GlobalInstallerExecFile`](GlobalInstallerExecFile.md)

Defined in: [types/proxy.ts:2785](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2785)

---

### sleep?

> `optional` **sleep?**: (`ms`) => `Promise`\<`void`\>

Defined in: [types/proxy.ts:2786](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2786)

#### Parameters

##### ms

`number`

#### Returns

`Promise`\<`void`\>
