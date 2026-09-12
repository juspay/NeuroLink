[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareProvisionRequest

# Type Alias: ProxyShareProvisionRequest

> **ProxyShareProvisionRequest** = `object`

Defined in: [types/proxy.ts:3844](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3844)

One borrower's outstanding request for a resident credential.

Holds the challenge, never a verifier and never a token — the lender is not
in a position to leak what it does not have. `code` exists only between the
lender authorizing and the borrower claiming, and is erased by consumption.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3845](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3845)

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3846](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3846)

---

### codeChallenge

> **codeChallenge**: `string`

Defined in: [types/proxy.ts:3848](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3848)

Base64url SHA-256 of the borrower's verifier.

---

### challengeMethod

> **challengeMethod**: `"S256"`

Defined in: [types/proxy.ts:3849](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3849)

---

### state

> **state**: `string`

Defined in: [types/proxy.ts:3851](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3851)

Borrower-chosen state, echoed through the authorization round trip.

---

### requestedAt

> **requestedAt**: `number`

Defined in: [types/proxy.ts:3852](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3852)

---

### expiresAt

> **expiresAt**: `number`

Defined in: [types/proxy.ts:3853](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3853)

---

### status

> **status**: [`ProxyShareProvisionStatus`](ProxyShareProvisionStatus.md)

Defined in: [types/proxy.ts:3854](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3854)

---

### code?

> `optional` **code?**: `string`

Defined in: [types/proxy.ts:3856](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3856)

Present only between authorization and the single claim that consumes it.

---

### authorizedAt?

> `optional` **authorizedAt?**: `number`

Defined in: [types/proxy.ts:3857](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3857)

---

### claimedAt?

> `optional` **claimedAt?**: `number`

Defined in: [types/proxy.ts:3858](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3858)

---

### accountLabel?

> `optional` **accountLabel?**: `string`

Defined in: [types/proxy.ts:3860](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3860)

Which of the lender's accounts was authorized, for the drift audit.
