[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPeerArgs

# Type Alias: ProxyPeerArgs

> **ProxyPeerArgs** = `object`

Defined in: [types/proxy.ts:4245](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4245)

## Properties

### action?

> `optional` **action?**: `"add"` \| `"request"` \| `"list"` \| `"status"` \| `"sync"` \| `"receipts"` \| `"net"` \| `"redeem"` \| `"test"` \| `"remove"` \| `"pause"` \| `"resume"` \| `"set"`

Defined in: [types/proxy.ts:4246](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4246)

---

### claim?

> `optional` **claim?**: `boolean`

Defined in: [types/proxy.ts:4261](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4261)

`peer request --claim`: collect a code the lender has authorized.

---

### receiptSecret?

> `optional` **receiptSecret?**: `string`

Defined in: [types/proxy.ts:4263](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4263)

Shared secret for verifying this lender's receipts, when added by hand.

---

### reciprocal?

> `optional` **reciprocal?**: `string`

Defined in: [types/proxy.ts:4265](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4265)

`peer net`: label of the grant this node issued to the same person.

---

### noteValue?

> `optional` **noteValue?**: `string`

Defined in: [types/proxy.ts:4267](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4267)

`peer redeem`: the coin note to present.

---

### check?

> `optional` **check?**: `boolean`

Defined in: [types/proxy.ts:4269](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4269)

`peer redeem --check`: ask the issuer about a note without spending it.

---

### label?

> `optional` **label?**: `string`

Defined in: [types/proxy.ts:4271](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4271)

Local account label for a provisioned credential.

---

### name?

> `optional` **name?**: `string`

Defined in: [types/proxy.ts:4272](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4272)

---

### url?

> `optional` **url?**: `string`

Defined in: [types/proxy.ts:4273](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4273)

---

### token?

> `optional` **token?**: `string`

Defined in: [types/proxy.ts:4274](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4274)

---

### link?

> `optional` **link?**: `string`

Defined in: [types/proxy.ts:4275](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4275)

---

### priority?

> `optional` **priority?**: `number`

Defined in: [types/proxy.ts:4276](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4276)

---

### note?

> `optional` **note?**: `string`

Defined in: [types/proxy.ts:4277](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4277)

---

### json?

> `optional` **json?**: `boolean`

Defined in: [types/proxy.ts:4278](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4278)

---

### dev?

> `optional` **dev?**: `boolean`

Defined in: [types/proxy.ts:4279](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4279)
