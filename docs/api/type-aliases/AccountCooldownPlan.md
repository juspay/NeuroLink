[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AccountCooldownPlan

# Type Alias: AccountCooldownPlan

> **AccountCooldownPlan** = `object`

Defined in: [types/proxy.ts:1069](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1069)

## Properties

### reason

> **reason**: [`RateLimitCoolingReason`](RateLimitCoolingReason.md)

Defined in: [types/proxy.ts:1070](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1070)

---

### scope

> **scope**: `"account"` \| `"model"`

Defined in: [types/proxy.ts:1076](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1076)

Whether this limit applies to every request on the account or only to the
requested model. Model scope must never be persisted as an account
cooldown; the quota window itself remains the routing evidence.

---

### coolingUntil

> **coolingUntil**: `number`

Defined in: [types/proxy.ts:1078](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1078)

Epoch-ms until which the limiting window is expected to recover.

---

### rotateImmediately

> **rotateImmediately**: `boolean`

Defined in: [types/proxy.ts:1082](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1082)

When true (unified/5h/7d rejected), rotate immediately — retrying the
same account is futile until its window resets. When false (transient
burst), a small number of jittered same-account retries is allowed first.
