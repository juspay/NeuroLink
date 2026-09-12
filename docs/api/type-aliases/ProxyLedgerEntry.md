[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLedgerEntry

# Type Alias: ProxyLedgerEntry

> **ProxyLedgerEntry** = `object`

Defined in: [types/proxyClient.ts:242](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L242)

One request as recorded in the proxy request log, reduced to what costing needs.

## Properties

### account

> **account**: `string`

Defined in: [types/proxyClient.ts:243](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L243)

---

### accountKey

> **accountKey**: `string`

Defined in: [types/proxyClient.ts:250](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L250)

Provider-qualified identity, "anthropic:<label>" or "codex:<label>".
Read from the log row when present; derived from `accountType` for rows
written before the pool logged it. This, not `account`, is the join key:
one email can be logged in to both engines.

---

### clientApp

> **clientApp**: `string`

Defined in: [types/proxyClient.ts:252](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L252)

Derived calling CLI; see CliAccountUsageTotals.byClient.

---

### accountType

> **accountType**: `string`

Defined in: [types/proxyClient.ts:253](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L253)

---

### model

> **model**: `string`

Defined in: [types/proxyClient.ts:254](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L254)

---

### provider?

> `optional` **provider?**: `string`

Defined in: [types/proxyClient.ts:255](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L255)

---

### inputTokens

> **inputTokens**: `number`

Defined in: [types/proxyClient.ts:256](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L256)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/proxyClient.ts:257](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L257)

---

### cacheReadTokens

> **cacheReadTokens**: `number`

Defined in: [types/proxyClient.ts:258](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L258)

---

### cacheCreationTokens

> **cacheCreationTokens**: `number`

Defined in: [types/proxyClient.ts:259](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L259)
