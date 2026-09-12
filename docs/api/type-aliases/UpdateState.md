[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / UpdateState

# Type Alias: UpdateState

> **UpdateState** = `object`

Defined in: [types/proxy.ts:2673](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2673)

Persisted state for the proxy auto-update feature.

## Properties

### lastCheckAt

> **lastCheckAt**: `string`

Defined in: [types/proxy.ts:2674](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2674)

---

### lastCheckVersion

> **lastCheckVersion**: `string`

Defined in: [types/proxy.ts:2675](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2675)

---

### suppressedVersions

> **suppressedVersions**: `Record`\<`string`, [`SuppressedVersion`](SuppressedVersion.md)\>

Defined in: [types/proxy.ts:2676](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2676)

---

### installedVersion?

> `optional` **installedVersion?**: `string` \| `null`

Defined in: [types/proxy.ts:2685](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2685)

Last package version whose stable trampoline was successfully validated.

Optional because `UpdateState` is part of the published type surface and a
required addition would break every downstream object literal — and because
state files written before this field existed legitimately omit it.
`loadUpdateState()` always materializes it, so runtime readers see a value.

---

### lastUpdateAt

> **lastUpdateAt**: `string` \| `null`

Defined in: [types/proxy.ts:2686](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2686)

---

### lastUpdateVersion

> **lastUpdateVersion**: `string` \| `null`

Defined in: [types/proxy.ts:2687](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2687)

---

### pendingRestartVersion

> **pendingRestartVersion**: `string` \| `null`

Defined in: [types/proxy.ts:2689](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2689)

Installed by the updater but not yet confirmed as the running version.

---

### deferredUpdate

> **deferredUpdate**: \{ `version`: `string`; `since`: `string`; `updatedAt`: `string`; `reason`: `"waiting_for_quiet"` \| `"draining"` \| `"drain_timeout"` \| `"drain_unavailable"` \| `"activity_unavailable"`; `activeRequests`: `number` \| `null`; \} \| `null`

Defined in: [types/proxy.ts:2691](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2691)

Why an available update has not yet reached a safe install/restart boundary.

---

### lastFailure

> **lastFailure**: \{ `at`: `string`; `version`: `string`; `stage`: `"check"` \| `"install"` \| `"validation"` \| `"restart"` \| `"health"`; `message`: `string`; \} \| `null`

Defined in: [types/proxy.ts:2704](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2704)

Last updater failure, retained until a successful update or replacement.
