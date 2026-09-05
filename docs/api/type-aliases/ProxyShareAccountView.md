[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareAccountView

# Type Alias: ProxyShareAccountView

> **ProxyShareAccountView** = `object`

Defined in: [types/proxy.ts:3726](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3726)

One candidate account as the share gates see it.

## Properties

### accountKey

> **accountKey**: `string`

Defined in: [types/proxy.ts:3727](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3727)

---

### sessionUsed

> **sessionUsed**: `number` \| `null`

Defined in: [types/proxy.ts:3729](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3729)

0..1 utilization of the 5h window, or null when unobserved.

---

### weeklyUsed

> **weeklyUsed**: `number` \| `null`

Defined in: [types/proxy.ts:3731](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3731)

0..1 utilization of the 7d window, or null when unobserved.

---

### sessionResetAt

> **sessionResetAt**: `number` \| `null`

Defined in: [types/proxy.ts:3733](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3733)

Epoch ms when the 5h window resets, or null when unknown.

---

### weeklyResetAt

> **weeklyResetAt**: `number` \| `null`

Defined in: [types/proxy.ts:3735](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3735)

Epoch ms when the 7d window resets, or null when unknown.

---

### borrowedSessionFraction

> **borrowedSessionFraction**: `number`

Defined in: [types/proxy.ts:3737](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3737)

Fraction (0..1) of the current 5h window this grant has already taken.

---

### borrowedWeeklyFraction

> **borrowedWeeklyFraction**: `number`

Defined in: [types/proxy.ts:3739](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3739)

Fraction (0..1) of the current 7d window this grant has already taken.
