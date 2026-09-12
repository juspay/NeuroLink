[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingWorkerSupervisorEvent

# Type Alias: RollingWorkerSupervisorEvent

> **RollingWorkerSupervisorEvent** = `object`

Defined in: [types/proxy.ts:2923](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2923)

## Properties

### at

> **at**: `string`

Defined in: [types/proxy.ts:2924](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2924)

---

### type

> **type**: `"activated"` \| `"failure"` \| `"failed_transfer"` \| `"rejected_socket"` \| `"worker_exit"`

Defined in: [types/proxy.ts:2925](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2925)

---

### generation

> **generation**: `number` \| `null`

Defined in: [types/proxy.ts:2931](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2931)

---

### version

> **version**: `string` \| `null`

Defined in: [types/proxy.ts:2932](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2932)

---

### phase?

> `optional` **phase?**: `"startup"` \| `"activation"` \| `"runtime"` \| `"transfer"`

Defined in: [types/proxy.ts:2933](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2933)

---

### reason?

> `optional` **reason?**: `string`

Defined in: [types/proxy.ts:2934](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2934)

---

### workerPid?

> `optional` **workerPid?**: `number`

Defined in: [types/proxy.ts:2935](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2935)

---

### workerProcessInstanceId?

> `optional` **workerProcessInstanceId?**: `string`

Defined in: [types/proxy.ts:2936](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2936)

---

### workerExitCode?

> `optional` **workerExitCode?**: `number` \| `null`

Defined in: [types/proxy.ts:2937](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2937)

---

### workerExitSignal?

> `optional` **workerExitSignal?**: `string` \| `null`

Defined in: [types/proxy.ts:2938](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2938)

---

### supervisorAction?

> `optional` **supervisorAction?**: [`RollingWorkerFailureDetails`](RollingWorkerFailureDetails.md)\[`"supervisorAction"`\]

Defined in: [types/proxy.ts:2939](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2939)
