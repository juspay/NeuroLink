[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyTerminalErrorSummary

# Type Alias: ProxyTerminalErrorSummary

> **ProxyTerminalErrorSummary** = `object`

Defined in: [types/proxy.ts:1146](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1146)

Compact, redacted terminal failure retained independently of body logs.

## Properties

### id

> **id**: `string`

Defined in: [types/proxy.ts:1147](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1147)

---

### at

> **at**: `number`

Defined in: [types/proxy.ts:1148](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1148)

---

### status

> **status**: `number`

Defined in: [types/proxy.ts:1149](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1149)

---

### category

> **category**: [`ProxyTerminalErrorCategory`](ProxyTerminalErrorCategory.md)

Defined in: [types/proxy.ts:1150](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1150)

---

### requestId?

> `optional` **requestId?**: `string`

Defined in: [types/proxy.ts:1151](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1151)

---

### account?

> `optional` **account?**: `string`

Defined in: [types/proxy.ts:1152](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1152)

---

### accountKey?

> `optional` **accountKey?**: `string`

Defined in: [types/proxy.ts:1154](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1154)

Provider-qualified account identity when the failure was attributable.

---

### accountType?

> `optional` **accountType?**: `string`

Defined in: [types/proxy.ts:1155](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1155)

---

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:1156](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1156)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:1157](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1157)

---

### terminalOutcome?

> `optional` **terminalOutcome?**: `string`

Defined in: [types/proxy.ts:1158](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1158)

---

### message?

> `optional` **message?**: `string`

Defined in: [types/proxy.ts:1159](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1159)
