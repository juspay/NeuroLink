[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareReceiptFile

# Type Alias: ProxyShareReceiptFile

> **ProxyShareReceiptFile** = `object`

Defined in: [types/proxy.ts:3892](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3892)

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3893](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3893)

---

### receipts

> **receipts**: `Record`\<`string`, [`ProxyShareReceipt`](ProxyShareReceipt.md)[]\>

Defined in: [types/proxy.ts:3895](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3895)

Per grant, oldest first, bounded.

---

### netted

> **netted**: `Record`\<`string`, `number`\>

Defined in: [types/proxy.ts:3897](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3897)

Cumulative coins each grant has had forgiven by netting.

---

### consumedTotal?

> `optional` **consumedTotal?**: `Record`\<`string`, `number`\>

Defined in: [types/proxy.ts:3904](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3904)

Lifetime coins receipted per grant.

Kept separately because `receipts` is trimmed: summing the retained history
would quietly under-count a busy grant, and netting reads this number.

---

### highestSequence?

> `optional` **highestSequence?**: `Record`\<`string`, `number`\>

Defined in: [types/proxy.ts:3912](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3912)

Highest sequence issued per grant, for the same reason.

Taking it from the retained tail is right only until the tail is trimmed
away, and a sequence that restarts would look like a replay to the
borrower's audit.
