[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPaths

# Type Alias: ProxyPaths

> **ProxyPaths** = `object`

Defined in: [types/proxy.ts:1729](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1729)

## Properties

### stateDir

> **stateDir**: `string`

Defined in: [types/proxy.ts:1731](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1731)

Base directory for proxy state files

---

### logsDir

> **logsDir**: `string`

Defined in: [types/proxy.ts:1733](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1733)

logs/ — request/response logs

---

### quotaFile

> **quotaFile**: `string`

Defined in: [types/proxy.ts:1735](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1735)

account-quotas.json — per-account rate limit state

---

### cooldownFile

> **cooldownFile**: `string`

Defined in: [types/proxy.ts:1737](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1737)

account-cooldowns.json — restart-safe account cooldown state

---

### statsFile?

> `optional` **statsFile?**: `string`

Defined in: [types/proxy.ts:1739](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1739)

proxy-usage-stats.json — restart- and handoff-safe usage counters

---

### grantsFile?

> `optional` **grantsFile?**: `string`

Defined in: [types/proxy.ts:1741](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1741)

proxy-grants.json — grants this node has issued to borrowers

---

### ledgerFile?

> `optional` **ledgerFile?**: `string`

Defined in: [types/proxy.ts:1743](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1743)

proxy-share-ledger.json — coin balances, holds and settled spend

---

### peersFile?

> `optional` **peersFile?**: `string`

Defined in: [types/proxy.ts:1745](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1745)

proxy-peers.json — lenders this node may borrow from

---

### isDev

> **isDev**: `boolean`

Defined in: [types/proxy.ts:1747](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1747)

Whether this is a dev-mode isolated instance
