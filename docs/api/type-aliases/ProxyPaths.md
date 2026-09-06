[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPaths

# Type Alias: ProxyPaths

> **ProxyPaths** = `object`

Defined in: [types/proxy.ts:1748](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1748)

## Properties

### stateDir

> **stateDir**: `string`

Defined in: [types/proxy.ts:1750](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1750)

Base directory for proxy state files

---

### logsDir

> **logsDir**: `string`

Defined in: [types/proxy.ts:1752](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1752)

logs/ — request/response logs

---

### quotaFile

> **quotaFile**: `string`

Defined in: [types/proxy.ts:1754](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1754)

account-quotas.json — per-account rate limit state

---

### cooldownFile

> **cooldownFile**: `string`

Defined in: [types/proxy.ts:1756](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1756)

account-cooldowns.json — restart-safe account cooldown state

---

### statsFile?

> `optional` **statsFile?**: `string`

Defined in: [types/proxy.ts:1758](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1758)

proxy-usage-stats.json — restart- and handoff-safe usage counters

---

### grantsFile?

> `optional` **grantsFile?**: `string`

Defined in: [types/proxy.ts:1760](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1760)

proxy-grants.json — grants this node has issued to borrowers

---

### ledgerFile?

> `optional` **ledgerFile?**: `string`

Defined in: [types/proxy.ts:1762](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1762)

proxy-share-ledger.json — coin balances, holds and settled spend

---

### peersFile?

> `optional` **peersFile?**: `string`

Defined in: [types/proxy.ts:1764](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1764)

proxy-peers.json — lenders this node may borrow from

---

### isDev

> **isDev**: `boolean`

Defined in: [types/proxy.ts:1766](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1766)

Whether this is a dev-mode isolated instance
