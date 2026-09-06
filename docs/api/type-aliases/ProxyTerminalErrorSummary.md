[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyTerminalErrorSummary

# Type Alias: ProxyTerminalErrorSummary

> **ProxyTerminalErrorSummary** = `object`

Defined in: [types/proxy.ts:1165](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1165)

Compact, redacted terminal failure retained independently of body logs.

## Properties

### id

> **id**: `string`

Defined in: [types/proxy.ts:1166](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1166)

---

### at

> **at**: `number`

Defined in: [types/proxy.ts:1167](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1167)

---

### status

> **status**: `number`

Defined in: [types/proxy.ts:1168](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1168)

---

### category

> **category**: [`ProxyTerminalErrorCategory`](ProxyTerminalErrorCategory.md)

Defined in: [types/proxy.ts:1169](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1169)

---

### requestId?

> `optional` **requestId?**: `string`

Defined in: [types/proxy.ts:1170](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1170)

---

### account?

> `optional` **account?**: `string`

Defined in: [types/proxy.ts:1171](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1171)

---

### accountKey?

> `optional` **accountKey?**: `string`

Defined in: [types/proxy.ts:1173](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1173)

Provider-qualified account identity when the failure was attributable.

---

### accountType?

> `optional` **accountType?**: `string`

Defined in: [types/proxy.ts:1174](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1174)

---

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:1175](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1175)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:1176](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1176)

---

### terminalOutcome?

> `optional` **terminalOutcome?**: `string`

Defined in: [types/proxy.ts:1177](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1177)

---

### message?

> `optional` **message?**: `string`

Defined in: [types/proxy.ts:1178](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1178)
