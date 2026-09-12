[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyUpdateWindowResult

# Type Alias: ProxyUpdateWindowResult

> **ProxyUpdateWindowResult** = `object`

Defined in: [types/proxy.ts:2713](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2713)

Result from waiting for a non-disruptive updater execution window.

## Properties

### ready

> **ready**: `boolean`

Defined in: [types/proxy.ts:2714](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2714)

---

### draining

> **draining**: `boolean`

Defined in: [types/proxy.ts:2715](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2715)

---

### reason?

> `optional` **reason?**: `"stopping"` \| `"parent_stopped"` \| `"drain_failed"` \| `"drain_timeout"`

Defined in: [types/proxy.ts:2716](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2716)
