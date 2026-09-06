[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPeerArgs

# Type Alias: ProxyPeerArgs

> **ProxyPeerArgs** = `object`

Defined in: [types/proxy.ts:4239](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4239)

## Properties

### action?

> `optional` **action?**: `"add"` \| `"request"` \| `"list"` \| `"status"` \| `"sync"` \| `"receipts"` \| `"net"` \| `"redeem"` \| `"test"` \| `"remove"` \| `"pause"` \| `"resume"` \| `"set"`

Defined in: [types/proxy.ts:4240](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4240)

---

### claim?

> `optional` **claim?**: `boolean`

Defined in: [types/proxy.ts:4255](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4255)

`peer request --claim`: collect a code the lender has authorized.

---

### receiptSecret?

> `optional` **receiptSecret?**: `string`

Defined in: [types/proxy.ts:4257](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4257)

Shared secret for verifying this lender's receipts, when added by hand.

---

### reciprocal?

> `optional` **reciprocal?**: `string`

Defined in: [types/proxy.ts:4259](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4259)

`peer net`: label of the grant this node issued to the same person.

---

### noteValue?

> `optional` **noteValue?**: `string`

Defined in: [types/proxy.ts:4261](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4261)

`peer redeem`: the coin note to present.

---

### check?

> `optional` **check?**: `boolean`

Defined in: [types/proxy.ts:4263](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4263)

`peer redeem --check`: ask the issuer about a note without spending it.

---

### label?

> `optional` **label?**: `string`

Defined in: [types/proxy.ts:4265](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4265)

Local account label for a provisioned credential.

---

### name?

> `optional` **name?**: `string`

Defined in: [types/proxy.ts:4266](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4266)

---

### url?

> `optional` **url?**: `string`

Defined in: [types/proxy.ts:4267](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4267)

---

### token?

> `optional` **token?**: `string`

Defined in: [types/proxy.ts:4268](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4268)

---

### link?

> `optional` **link?**: `string`

Defined in: [types/proxy.ts:4269](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4269)

---

### priority?

> `optional` **priority?**: `number`

Defined in: [types/proxy.ts:4270](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4270)

---

### note?

> `optional` **note?**: `string`

Defined in: [types/proxy.ts:4271](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4271)

---

### json?

> `optional` **json?**: `boolean`

Defined in: [types/proxy.ts:4272](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4272)

---

### dev?

> `optional` **dev?**: `boolean`

Defined in: [types/proxy.ts:4273](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4273)
