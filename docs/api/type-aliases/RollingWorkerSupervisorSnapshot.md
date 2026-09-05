[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingWorkerSupervisorSnapshot

# Type Alias: RollingWorkerSupervisorSnapshot

> **RollingWorkerSupervisorSnapshot** = `object`

Defined in: [types/proxy.ts:2864](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2864)

## Properties

### generation

> **generation**: `number`

Defined in: [types/proxy.ts:2865](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2865)

---

### active

> **active**: \{ `pid`: `number`; `version`: `string`; `generation`: `number`; \} \| `null`

Defined in: [types/proxy.ts:2866](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2866)

---

### candidate

> **candidate**: \{ `pid`: `number`; `expectedVersion`: `string`; `generation`: `number`; \} \| `null`

Defined in: [types/proxy.ts:2867](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2867)

---

### draining

> **draining**: `object`[]

Defined in: [types/proxy.ts:2872](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2872)

#### pid

> **pid**: `number`

#### version

> **version**: `string`

#### generation

> **generation**: `number`

---

### queuedSockets

> **queuedSockets**: `number`

Defined in: [types/proxy.ts:2873](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2873)

---

### pendingTransfers?

> `optional` **pendingTransfers?**: `number`

Defined in: [types/proxy.ts:2875](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2875)

Offered sockets awaiting acknowledgement or commit, across all workers.

---

### rejectedSockets

> **rejectedSockets**: `number`

Defined in: [types/proxy.ts:2876](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2876)

---

### failedTransfers

> **failedTransfers**: `number`

Defined in: [types/proxy.ts:2877](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2877)

---

### recentEvents

> **recentEvents**: [`RollingWorkerSupervisorEvent`](RollingWorkerSupervisorEvent.md)[]

Defined in: [types/proxy.ts:2879](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2879)

Bounded generation-scoped evidence for attributing lifetime counters.

---

### lastFailure

> **lastFailure**: `object` & [`RollingWorkerFailureDetails`](RollingWorkerFailureDetails.md) \| `null`

Defined in: [types/proxy.ts:2880](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2880)
