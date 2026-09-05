[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPoolHeadroom

# Type Alias: ProxyPoolHeadroom

> **ProxyPoolHeadroom** = `object`

Defined in: [types/proxy.ts:1539](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1539)

Aggregate account-pool headroom at the moment a response was produced.

## Properties

### available

> **available**: `number`

Defined in: [types/proxy.ts:1541](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1541)

Accounts eligible to serve a request right now (not cooling/disabled).

---

### cooling

> **cooling**: `number`

Defined in: [types/proxy.ts:1543](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1543)

Accounts currently in a cooldown window.

---

### bestSessionLeftPct?

> `optional` **bestSessionLeftPct?**: `number`

Defined in: [types/proxy.ts:1546](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1546)

Best session headroom across available accounts, as a percentage 0-100.
Undefined when no available account has a quota snapshot.
