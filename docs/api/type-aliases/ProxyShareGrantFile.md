[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareGrantFile

# Type Alias: ProxyShareGrantFile

> **ProxyShareGrantFile** = `object`

Defined in: [types/proxy.ts:3618](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3618)

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3619](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3619)

---

### grants

> **grants**: `Record`\<`string`, [`ProxyShareGrant`](ProxyShareGrant.md)\>

Defined in: [types/proxy.ts:3620](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3620)

---

### publicUrl?

> `optional` **publicUrl?**: `string`

Defined in: [types/proxy.ts:3623](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3623)

This node's stable public address, when it has one. Recorded once so
every share link is minted against it without retyping.

---

### noteSecret?

> `optional` **noteSecret?**: `string`

Defined in: [types/proxy.ts:3625](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3625)

Node-level secret coin notes are signed with. Minted on first issue.
