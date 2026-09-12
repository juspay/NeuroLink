[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / StreamSerializerAdapter

# Type Alias: StreamSerializerAdapter

> **StreamSerializerAdapter** = `object`

Defined in: [types/proxy.ts:3368](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3368)

Common adapter interface that hides the differences between
Claude and OpenAI stream serializers from the unified translation engine.

## Methods

### start()

> **start**(): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3369](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3369)

#### Returns

`Iterable`\<`string`\>

---

### pushDelta()

> **pushDelta**(`text`): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3370](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3370)

#### Parameters

##### text

`string`

#### Returns

`Iterable`\<`string`\>

---

### pushToolUse()

> **pushToolUse**(`id`, `name`, `input`): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3371](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3371)

#### Parameters

##### id

`string`

##### name

`string`

##### input

`unknown`

#### Returns

`Iterable`\<`string`\>

---

### finish()

> **finish**(`finishReason`, `usage`): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3372](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3372)

#### Parameters

##### finishReason

`string`

##### usage

###### input

`number`

###### output

`number`

###### total

`number`

#### Returns

`Iterable`\<`string`\>

---

### emitError()

> **emitError**(`message`): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3376](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3376)

#### Parameters

##### message

`string`

#### Returns

`Iterable`\<`string`\>
