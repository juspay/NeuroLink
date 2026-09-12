[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLedgerFileCursor

# Type Alias: ProxyLedgerFileCursor

> **ProxyLedgerFileCursor** = `object`

Defined in: [types/proxyClient.ts:263](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L263)

Incremental read position and accumulated entries for one request-log file.

## Properties

### offset

> **offset**: `number`

Defined in: [types/proxyClient.ts:265](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L265)

Byte offset just past the last complete line consumed.

---

### size

> **size**: `number`

Defined in: [types/proxyClient.ts:266](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L266)

---

### entries

> **entries**: `Map`\<`string`, [`ProxyLedgerEntry`](ProxyLedgerEntry.md)\>

Defined in: [types/proxyClient.ts:268](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L268)

requestId -> latest known entry, so a re-logged request cannot double count.
