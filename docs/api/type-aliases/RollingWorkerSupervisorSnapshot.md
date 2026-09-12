[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RollingWorkerSupervisorSnapshot

# Type Alias: RollingWorkerSupervisorSnapshot

> **RollingWorkerSupervisorSnapshot** = `object`

Defined in: [types/proxy.ts:2942](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2942)

## Properties

### generation

> **generation**: `number`

Defined in: [types/proxy.ts:2943](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2943)

---

### active

> **active**: \{ `pid`: `number`; `version`: `string`; `generation`: `number`; \} \| `null`

Defined in: [types/proxy.ts:2944](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2944)

---

### candidate

> **candidate**: \{ `pid`: `number`; `expectedVersion`: `string`; `generation`: `number`; \} \| `null`

Defined in: [types/proxy.ts:2945](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2945)

---

### draining

> **draining**: `object`[]

Defined in: [types/proxy.ts:2950](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2950)

#### pid

> **pid**: `number`

#### version

> **version**: `string`

#### generation

> **generation**: `number`

---

### queuedSockets

> **queuedSockets**: `number`

Defined in: [types/proxy.ts:2951](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2951)

---

### pendingTransfers?

> `optional` **pendingTransfers?**: `number`

Defined in: [types/proxy.ts:2953](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2953)

Offered sockets awaiting acknowledgement or commit, across all workers.

---

### rejectedSockets

> **rejectedSockets**: `number`

Defined in: [types/proxy.ts:2954](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2954)

---

### failedTransfers

> **failedTransfers**: `number`

Defined in: [types/proxy.ts:2955](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2955)

---

### recentEvents

> **recentEvents**: [`RollingWorkerSupervisorEvent`](RollingWorkerSupervisorEvent.md)[]

Defined in: [types/proxy.ts:2957](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2957)

Bounded generation-scoped evidence for attributing lifetime counters.

---

### lastFailure

> **lastFailure**: `object` & [`RollingWorkerFailureDetails`](RollingWorkerFailureDetails.md) \| `null`

Defined in: [types/proxy.ts:2958](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2958)
