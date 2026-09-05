[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyTerminalErrorJournal

# Type Alias: ProxyTerminalErrorJournal

> **ProxyTerminalErrorJournal** = `object`

Defined in: [types/proxy.ts:1211](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1211)

Bounded terminal-error state stored separately from counters and body logs.

## Properties

### startedAt

> **startedAt**: `number`

Defined in: [types/proxy.ts:1212](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1212)

---

### totalErrors

> **totalErrors**: `number`

Defined in: [types/proxy.ts:1213](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1213)

---

### counts

> **counts**: `Record`\<[`ProxyTerminalErrorCategory`](ProxyTerminalErrorCategory.md), `number`\>

Defined in: [types/proxy.ts:1214](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1214)

---

### recent

> **recent**: [`ProxyTerminalErrorSummary`](ProxyTerminalErrorSummary.md)[]

Defined in: [types/proxy.ts:1215](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1215)
