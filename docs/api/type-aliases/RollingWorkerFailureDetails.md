[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingWorkerFailureDetails

# Type Alias: RollingWorkerFailureDetails

> **RollingWorkerFailureDetails** = `object`

Defined in: [types/proxy.ts:2912](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2912)

## Properties

### workerPid?

> `optional` **workerPid?**: `number`

Defined in: [types/proxy.ts:2913](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2913)

---

### workerExitCode?

> `optional` **workerExitCode?**: `number` \| `null`

Defined in: [types/proxy.ts:2914](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2914)

---

### workerExitSignal?

> `optional` **workerExitSignal?**: `string` \| `null`

Defined in: [types/proxy.ts:2915](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2915)

---

### supervisorAction?

> `optional` **supervisorAction?**: `"none"` \| `"sigkill_after_transfer_failure"` \| `"cancel_socket_replace_before_drain"` \| `"cancel_uncommitted_socket"`

Defined in: [types/proxy.ts:2916](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2916)
