[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingWorkerFailureDetails

# Type Alias: RollingWorkerFailureDetails

> **RollingWorkerFailureDetails** = `object`

Defined in: [types/proxy.ts:2845](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2845)

## Properties

### workerPid?

> `optional` **workerPid?**: `number`

Defined in: [types/proxy.ts:2846](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2846)

---

### workerExitCode?

> `optional` **workerExitCode?**: `number` \| `null`

Defined in: [types/proxy.ts:2847](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2847)

---

### workerExitSignal?

> `optional` **workerExitSignal?**: `string` \| `null`

Defined in: [types/proxy.ts:2848](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2848)

---

### supervisorAction?

> `optional` **supervisorAction?**: `"none"` \| `"sigkill_after_transfer_failure"` \| `"cancel_uncommitted_socket"`

Defined in: [types/proxy.ts:2849](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2849)
