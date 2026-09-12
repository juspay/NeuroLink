[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareAccountView

# Type Alias: ProxyShareAccountView

> **ProxyShareAccountView** = `object`

Defined in: [types/proxy.ts:3810](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3810)

One candidate account as the share gates see it.

## Properties

### accountKey

> **accountKey**: `string`

Defined in: [types/proxy.ts:3811](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3811)

---

### sessionUsed

> **sessionUsed**: `number` \| `null`

Defined in: [types/proxy.ts:3813](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3813)

0..1 utilization of the 5h window, or null when unobserved.

---

### weeklyUsed

> **weeklyUsed**: `number` \| `null`

Defined in: [types/proxy.ts:3815](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3815)

0..1 utilization of the 7d window, or null when unobserved.

---

### sessionResetAt

> **sessionResetAt**: `number` \| `null`

Defined in: [types/proxy.ts:3817](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3817)

Epoch ms when the 5h window resets, or null when unknown.

---

### weeklyResetAt

> **weeklyResetAt**: `number` \| `null`

Defined in: [types/proxy.ts:3819](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3819)

Epoch ms when the 7d window resets, or null when unknown.

---

### borrowedSessionFraction

> **borrowedSessionFraction**: `number`

Defined in: [types/proxy.ts:3821](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3821)

Fraction (0..1) of the current 5h window this grant has already taken.

---

### borrowedWeeklyFraction

> **borrowedWeeklyFraction**: `number`

Defined in: [types/proxy.ts:3823](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3823)

Fraction (0..1) of the current 7d window this grant has already taken.
