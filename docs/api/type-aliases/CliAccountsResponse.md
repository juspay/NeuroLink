[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CliAccountsResponse

# Type Alias: CliAccountsResponse

> **CliAccountsResponse** = `object`

Defined in: [types/proxyClient.ts:227](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L227)

Response body of GET /accounts.

## Properties

### generatedAt

> **generatedAt**: `number`

Defined in: [types/proxyClient.ts:228](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L228)

---

### usageDate

> **usageDate**: `string`

Defined in: [types/proxyClient.ts:230](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L230)

UTC date whose request log the usage totals cover.

---

### quotaFromSnapshot

> **quotaFromSnapshot**: `boolean`

Defined in: [types/proxyClient.ts:232](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L232)

True when quota came from the stored snapshot rather than a live fetch.

---

### usageError

> **usageError**: `string` \| `null`

Defined in: [types/proxyClient.ts:234](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L234)

Set when the usage totals could not be read at all.

---

### quotaError

> **quotaError**: `string` \| `null`

Defined in: [types/proxyClient.ts:236](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L236)

Set when the quota snapshot could not be read; rows still carry status.

---

### costBasis

> **costBasis**: `"api-equivalent"`

Defined in: [types/proxyClient.ts:237](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L237)

---

### accounts

> **accounts**: [`CliAccountsRow`](CliAccountsRow.md)[]

Defined in: [types/proxyClient.ts:238](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L238)
