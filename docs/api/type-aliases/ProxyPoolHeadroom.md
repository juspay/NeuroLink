[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPoolHeadroom

# Type Alias: ProxyPoolHeadroom

> **ProxyPoolHeadroom** = `object`

Defined in: [types/proxy.ts:1562](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1562)

Aggregate account-pool headroom at the moment a response was produced.

## Properties

### available

> **available**: `number`

Defined in: [types/proxy.ts:1564](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1564)

Accounts eligible to serve a request right now (not cooling/disabled).

---

### cooling

> **cooling**: `number`

Defined in: [types/proxy.ts:1566](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1566)

Accounts currently in a cooldown window.

---

### bestSessionLeftPct?

> `optional` **bestSessionLeftPct?**: `number`

Defined in: [types/proxy.ts:1569](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1569)

Best session headroom across available accounts, as a percentage 0-100.
Undefined when no available account has a quota snapshot.
