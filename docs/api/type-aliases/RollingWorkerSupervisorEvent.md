[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingWorkerSupervisorEvent

# Type Alias: RollingWorkerSupervisorEvent

> **RollingWorkerSupervisorEvent** = `object`

Defined in: [types/proxy.ts:2855](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2855)

## Properties

### at

> **at**: `string`

Defined in: [types/proxy.ts:2856](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2856)

---

### type

> **type**: `"activated"` \| `"failure"` \| `"failed_transfer"` \| `"rejected_socket"`

Defined in: [types/proxy.ts:2857](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2857)

---

### generation

> **generation**: `number` \| `null`

Defined in: [types/proxy.ts:2858](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2858)

---

### version

> **version**: `string` \| `null`

Defined in: [types/proxy.ts:2859](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2859)

---

### phase?

> `optional` **phase?**: `"startup"` \| `"activation"` \| `"runtime"` \| `"transfer"`

Defined in: [types/proxy.ts:2860](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2860)

---

### reason?

> `optional` **reason?**: `string`

Defined in: [types/proxy.ts:2861](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2861)
