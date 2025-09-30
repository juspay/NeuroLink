# Human-in-the-Loop (HITL) Workflows

> **Since**: v7.39.0 | **Status**: Stable | **Availability**: SDK

## Overview

**What it does**: HITL pauses AI tool execution to request explicit user approval before performing risky operations like deleting files, modifying databases, or making expensive API calls.

**Why use it**: Prevent costly mistakes and give users control over potentially dangerous AI actions. Think of it as an "Are you sure?" dialog for AI assistant operations.

**Common use cases**:

- File deletion or modification operations
- Database write/delete operations
- Expensive third-party API calls
- Irreversible actions (sending emails, posting to social media)
- Operations accessing sensitive data

## Quick Start

### SDK Example

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink({
  tools: [
    {
      name: "deleteFile",
      description: "Deletes a file from the filesystem",
      requiresConfirmation: true, // ← Enable HITL for this tool
      execute: async (args) => {
        // Your deletion logic
      },
    },
  ],
});

// When AI tries to use deleteFile:
// 1. Tool execution pauses
// 2. Returns USER_CONFIRMATION_REQUIRED error
// 3. Application shows confirmation dialog
// 4. On approval, tool executes with confirmation_received = true
```

### Handling Confirmation in Your UI

```typescript
// When tool requires confirmation
if (error.code === "USER_CONFIRMATION_REQUIRED") {
  const approved = await showConfirmationDialog({
    action: tool.name,
    details: tool.args,
    message: "AI wants to perform this action. Allow?",
  });

  if (approved) {
    // Grant one-time permission and retry
    setUserConfirmation(true);
    const result = await executeTool(tool);
    setUserConfirmation(false); // Reset immediately
    return result;
  } else {
    // User denied - inform the AI
    return { cancelled: true, reason: "User denied permission" };
  }
}
```

## Configuration

| Option                 | Type      | Default | Required | Description                          |
| ---------------------- | --------- | ------- | -------- | ------------------------------------ |
| `requiresConfirmation` | `boolean` | `false` | No       | Mark tool as requiring user approval |

### Tool Registration

```typescript
const riskyTool = {
  name: "sendEmail",
  description: "Sends an email to a recipient",
  requiresConfirmation: true, // Enable HITL
  parameters: {
    /* ... */
  },
  execute: async (args) => {
    /* ... */
  },
};
```

## How It Works

### Execution Flow

1. **AI requests tool execution** → Tool executor checks if tool requires confirmation
2. **Confirmation required?** → Returns `USER_CONFIRMATION_REQUIRED` error to LLM
3. **LLM asks user** → "I need to [action]. Is that okay?"
4. **User responds**:
   - **Approve** → UI sets `confirmation_received = true` and retries tool execution
   - **Deny** → UI sends "User cancelled" message back to LLM
5. **Tool executes** → Permission flag immediately resets to `false`

### Security Features

- **One-time permissions**: Each approval works for exactly one action
- **No reuse**: AI cannot reuse old permissions for new actions
- **Automatic reset**: Permission flag clears immediately after use
- **Fail-safe**: Defaults to requiring permission when in doubt

## API Reference

### SDK Methods

- `setUserConfirmation(approved: boolean)` → Grants/revokes one-time permission
- `executeTool(name, args)` → Executes tool with HITL checkpoint

See [HUMAN-IN-THE-LOOP.md](../HUMAN-IN-THE-LOOP.md) for complete technical documentation.

## Troubleshooting

### Problem: Tool executes without asking for permission

**Cause**: Tool not marked with `requiresConfirmation: true`
**Solution**:

```typescript
// Add confirmation flag to tool definition
const tool = {
  name: "deleteTool",
  requiresConfirmation: true, // ← Add this
  // ...
};
```

### Problem: AI keeps asking for confirmation repeatedly

**Cause**: `confirmation_received` flag not being reset after execution
**Solution**:

```typescript
// Always reset the flag after tool execution
setUserConfirmation(true);
await executeTool();
setUserConfirmation(false); // ← Don't forget this
```

### Problem: Confirmation dialog doesn't show

**Cause**: UI not handling `USER_CONFIRMATION_REQUIRED` error
**Solution**:

```typescript
// Catch and handle confirmation errors
try {
  await executeTool(toolName, args);
} catch (error) {
  if (error.code === "USER_CONFIRMATION_REQUIRED") {
    // Show your confirmation UI
    await handleConfirmationPrompt(error);
  }
}
```

## Best Practices

### For Developers

1. **Mark tools conservatively** - If an operation could cause problems, require confirmation
2. **Clear prompts** - Ensure users understand exactly what will happen
3. **Test confirmation flow** - Verify it works smoothly in your UI
4. **Log approvals** - Keep audit trail of user decisions
5. **Handle denials gracefully** - Allow users to try alternative approaches

### What to Mark as Requiring Confirmation

✅ **Do require confirmation**:

- File deletions
- Database writes/deletes
- Sending emails or messages
- Making purchases or payments
- Modifying production systems

❌ **Don't require confirmation**:

- Read-only operations
- Answering questions
- Generating content
- Searching/fetching data

## Related Features

- [Guardrails Middleware](./guardrails.md) - Content filtering and safety checks
- [Custom Tools](../sdk/custom-tools.md) - Building your own tools with HITL
- [Middleware Architecture](../MIDDLEWARE.md) - Advanced request interception

## Migration Notes

If upgrading from versions before v7.39.0:

1. Review all existing tools for risk assessment
2. Add `requiresConfirmation: true` to risky tools
3. Implement confirmation dialog in your UI
4. Test with low-risk tools first
5. Roll out to production gradually

For comprehensive technical documentation, diagrams, and security details, see the [complete HITL guide](../HUMAN-IN-THE-LOOP.md).
