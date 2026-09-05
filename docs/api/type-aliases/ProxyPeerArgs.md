[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPeerArgs

# Type Alias: ProxyPeerArgs

> **ProxyPeerArgs** = `object`

Defined in: [types/proxy.ts:4161](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4161)

## Properties

### action?

> `optional` **action?**: `"add"` \| `"request"` \| `"list"` \| `"status"` \| `"sync"` \| `"receipts"` \| `"net"` \| `"redeem"` \| `"test"` \| `"remove"` \| `"pause"` \| `"resume"` \| `"set"`

Defined in: [types/proxy.ts:4162](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4162)

---

### claim?

> `optional` **claim?**: `boolean`

Defined in: [types/proxy.ts:4177](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4177)

`peer request --claim`: collect a code the lender has authorized.

---

### receiptSecret?

> `optional` **receiptSecret?**: `string`

Defined in: [types/proxy.ts:4179](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4179)

Shared secret for verifying this lender's receipts, when added by hand.

---

### reciprocal?

> `optional` **reciprocal?**: `string`

Defined in: [types/proxy.ts:4181](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4181)

`peer net`: label of the grant this node issued to the same person.

---

### noteValue?

> `optional` **noteValue?**: `string`

Defined in: [types/proxy.ts:4183](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4183)

`peer redeem`: the coin note to present.

---

### check?

> `optional` **check?**: `boolean`

Defined in: [types/proxy.ts:4185](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4185)

`peer redeem --check`: ask the issuer about a note without spending it.

---

### label?

> `optional` **label?**: `string`

Defined in: [types/proxy.ts:4187](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4187)

Local account label for a provisioned credential.

---

### name?

> `optional` **name?**: `string`

Defined in: [types/proxy.ts:4188](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4188)

---

### url?

> `optional` **url?**: `string`

Defined in: [types/proxy.ts:4189](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4189)

---

### token?

> `optional` **token?**: `string`

Defined in: [types/proxy.ts:4190](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4190)

---

### link?

> `optional` **link?**: `string`

Defined in: [types/proxy.ts:4191](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4191)

---

### priority?

> `optional` **priority?**: `number`

Defined in: [types/proxy.ts:4192](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4192)

---

### note?

> `optional` **note?**: `string`

Defined in: [types/proxy.ts:4193](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4193)

---

### json?

> `optional` **json?**: `boolean`

Defined in: [types/proxy.ts:4194](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4194)

---

### dev?

> `optional` **dev?**: `boolean`

Defined in: [types/proxy.ts:4195](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4195)
