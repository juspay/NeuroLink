[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / UpdaterWorkerSupervisor

# Type Alias: UpdaterWorkerSupervisor

> **UpdaterWorkerSupervisor** = `object`

Defined in: [types/proxy.ts:2800](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2800)

Handle used by the proxy process to inspect and stop updater supervision.

## Properties

### currentPid

> **currentPid**: () => `number` \| `undefined`

Defined in: [types/proxy.ts:2801](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2801)

#### Returns

`number` \| `undefined`

---

### checkNow

> **checkNow**: () => `number` \| `undefined`

Defined in: [types/proxy.ts:2802](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2802)

#### Returns

`number` \| `undefined`

---

### stop

> **stop**: () => `void`

Defined in: [types/proxy.ts:2803](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2803)

#### Returns

`void`
