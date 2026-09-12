[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyTerminalErrorSummary

# Type Alias: ProxyTerminalErrorSummary

> **ProxyTerminalErrorSummary** = `object`

Defined in: [types/proxy.ts:1169](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1169)

Compact, redacted terminal failure retained independently of body logs.

## Properties

### id

> **id**: `string`

Defined in: [types/proxy.ts:1170](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1170)

---

### at

> **at**: `number`

Defined in: [types/proxy.ts:1171](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1171)

---

### status

> **status**: `number`

Defined in: [types/proxy.ts:1172](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1172)

---

### category

> **category**: [`ProxyTerminalErrorCategory`](ProxyTerminalErrorCategory.md)

Defined in: [types/proxy.ts:1173](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1173)

---

### requestId?

> `optional` **requestId?**: `string`

Defined in: [types/proxy.ts:1174](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1174)

---

### account?

> `optional` **account?**: `string`

Defined in: [types/proxy.ts:1175](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1175)

---

### accountKey?

> `optional` **accountKey?**: `string`

Defined in: [types/proxy.ts:1177](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1177)

Provider-qualified account identity when the failure was attributable.

---

### accountType?

> `optional` **accountType?**: `string`

Defined in: [types/proxy.ts:1178](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1178)

---

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:1179](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1179)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:1180](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1180)

---

### terminalOutcome?

> `optional` **terminalOutcome?**: `string`

Defined in: [types/proxy.ts:1181](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1181)

---

### message?

> `optional` **message?**: `string`

Defined in: [types/proxy.ts:1182](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1182)
