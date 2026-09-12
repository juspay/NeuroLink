[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyTerminalErrorJournal

# Type Alias: ProxyTerminalErrorJournal

> **ProxyTerminalErrorJournal** = `object`

Defined in: [types/proxy.ts:1234](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1234)

Bounded terminal-error state stored separately from counters and body logs.

## Properties

### startedAt

> **startedAt**: `number`

Defined in: [types/proxy.ts:1235](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1235)

---

### totalErrors

> **totalErrors**: `number`

Defined in: [types/proxy.ts:1236](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1236)

---

### counts

> **counts**: `Record`\<[`ProxyTerminalErrorCategory`](ProxyTerminalErrorCategory.md), `number`\>

Defined in: [types/proxy.ts:1237](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1237)

---

### recent

> **recent**: [`ProxyTerminalErrorSummary`](ProxyTerminalErrorSummary.md)[]

Defined in: [types/proxy.ts:1238](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1238)
