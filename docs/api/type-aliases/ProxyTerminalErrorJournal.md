[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyTerminalErrorJournal

# Type Alias: ProxyTerminalErrorJournal

> **ProxyTerminalErrorJournal** = `object`

Defined in: [types/proxy.ts:1230](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1230)

Bounded terminal-error state stored separately from counters and body logs.

## Properties

### startedAt

> **startedAt**: `number`

Defined in: [types/proxy.ts:1231](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1231)

---

### totalErrors

> **totalErrors**: `number`

Defined in: [types/proxy.ts:1232](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1232)

---

### counts

> **counts**: `Record`\<[`ProxyTerminalErrorCategory`](ProxyTerminalErrorCategory.md), `number`\>

Defined in: [types/proxy.ts:1233](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1233)

---

### recent

> **recent**: [`ProxyTerminalErrorSummary`](ProxyTerminalErrorSummary.md)[]

Defined in: [types/proxy.ts:1234](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1234)
