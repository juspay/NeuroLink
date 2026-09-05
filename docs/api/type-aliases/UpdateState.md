[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / UpdateState

# Type Alias: UpdateState

> **UpdateState** = `object`

Defined in: [types/proxy.ts:2609](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2609)

Persisted state for the proxy auto-update feature.

## Properties

### lastCheckAt

> **lastCheckAt**: `string`

Defined in: [types/proxy.ts:2610](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2610)

---

### lastCheckVersion

> **lastCheckVersion**: `string`

Defined in: [types/proxy.ts:2611](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2611)

---

### suppressedVersions

> **suppressedVersions**: `Record`\<`string`, [`SuppressedVersion`](SuppressedVersion.md)\>

Defined in: [types/proxy.ts:2612](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2612)

---

### installedVersion?

> `optional` **installedVersion?**: `string` \| `null`

Defined in: [types/proxy.ts:2621](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2621)

Last package version whose stable trampoline was successfully validated.

Optional because `UpdateState` is part of the published type surface and a
required addition would break every downstream object literal — and because
state files written before this field existed legitimately omit it.
`loadUpdateState()` always materializes it, so runtime readers see a value.

---

### lastUpdateAt

> **lastUpdateAt**: `string` \| `null`

Defined in: [types/proxy.ts:2622](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2622)

---

### lastUpdateVersion

> **lastUpdateVersion**: `string` \| `null`

Defined in: [types/proxy.ts:2623](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2623)

---

### pendingRestartVersion

> **pendingRestartVersion**: `string` \| `null`

Defined in: [types/proxy.ts:2625](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2625)

Installed by the updater but not yet confirmed as the running version.

---

### deferredUpdate

> **deferredUpdate**: \{ `version`: `string`; `since`: `string`; `updatedAt`: `string`; `reason`: `"waiting_for_quiet"` \| `"draining"` \| `"drain_timeout"` \| `"drain_unavailable"` \| `"activity_unavailable"`; `activeRequests`: `number` \| `null`; \} \| `null`

Defined in: [types/proxy.ts:2627](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2627)

Why an available update has not yet reached a safe install/restart boundary.

---

### lastFailure

> **lastFailure**: \{ `at`: `string`; `version`: `string`; `stage`: `"check"` \| `"install"` \| `"validation"` \| `"restart"` \| `"health"`; `message`: `string`; \} \| `null`

Defined in: [types/proxy.ts:2640](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2640)

Last updater failure, retained until a successful update or replacement.
