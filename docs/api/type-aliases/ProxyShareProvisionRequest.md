[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareProvisionRequest

# Type Alias: ProxyShareProvisionRequest

> **ProxyShareProvisionRequest** = `object`

Defined in: [types/proxy.ts:3760](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3760)

One borrower's outstanding request for a resident credential.

Holds the challenge, never a verifier and never a token — the lender is not
in a position to leak what it does not have. `code` exists only between the
lender authorizing and the borrower claiming, and is erased by consumption.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3761](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3761)

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3762](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3762)

---

### codeChallenge

> **codeChallenge**: `string`

Defined in: [types/proxy.ts:3764](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3764)

Base64url SHA-256 of the borrower's verifier.

---

### challengeMethod

> **challengeMethod**: `"S256"`

Defined in: [types/proxy.ts:3765](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3765)

---

### state

> **state**: `string`

Defined in: [types/proxy.ts:3767](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3767)

Borrower-chosen state, echoed through the authorization round trip.

---

### requestedAt

> **requestedAt**: `number`

Defined in: [types/proxy.ts:3768](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3768)

---

### expiresAt

> **expiresAt**: `number`

Defined in: [types/proxy.ts:3769](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3769)

---

### status

> **status**: [`ProxyShareProvisionStatus`](ProxyShareProvisionStatus.md)

Defined in: [types/proxy.ts:3770](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3770)

---

### code?

> `optional` **code?**: `string`

Defined in: [types/proxy.ts:3772](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3772)

Present only between authorization and the single claim that consumes it.

---

### authorizedAt?

> `optional` **authorizedAt?**: `number`

Defined in: [types/proxy.ts:3773](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3773)

---

### claimedAt?

> `optional` **claimedAt?**: `number`

Defined in: [types/proxy.ts:3774](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3774)

---

### accountLabel?

> `optional` **accountLabel?**: `string`

Defined in: [types/proxy.ts:3776](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3776)

Which of the lender's accounts was authorized, for the drift audit.
