# Implementation Plan: Interactive CLI (REPL) Mode

## Table of Contents
1. [Summary](#summary)
2. [What is an Interactive CLI (REPL)?](#what-is-an-interactive-cli-repl)
3. [Why Integrate an Interactive Mode?](#why-integrate-an-interactive-mode)
4. [How We Will Achieve It](#how-we-will-achieve-it)
5. [Approaches We Considered](#approaches-we-considered)
6. [What We Chose and Why](#what-we-chose-and-why)
7. [Implementation Details](#implementation-details)
8. [Risks and Mitigation](#risks-and-mitigation)

---

## Summary

This document outlines the implementation plan for an **Interactive CLI (REPL) Mode** for the NeuroLink SDK. This feature will transform the CLI from a single-command execution tool into a persistent, stateful session, allowing users to execute multiple commands sequentially without restarting the application.

This will be achieved by introducing a new "interactive mode" that launches when the CLI is run without arguments. The core of the work involves refactoring existing command handlers to be stateless and reusable, and building a session manager that handles user input, command parsing, and state management within a persistent loop. This foundational enhancement will dramatically improve developer experience and enable future capabilities like conversation history and session-based context.

**Key Features:**
- **Persistent Session**: Run multiple commands without exiting.
- **Interactive Prompt**: A familiar REPL experience (e.g., `neurolink>`).
- **Stateless Command Handlers**: Refactored logic for maximum reusability.
- **Backward Compatibility**: The CLI will retain its current single-shot execution behavior when run with arguments.

---

## What is an Interactive CLI (REPL)?

A Read-Eval-Print Loop (REPL) is an interactive programming environment that takes single user inputs, evaluates them, and returns the result to the user.

### Core Concepts

**1. Single-Shot Execution (Current Model)**
- The user provides all input at once (`neurolink generate "Hello"`).
- The application starts, performs one task, and immediately terminates.
- Each execution is isolated and has no memory of previous commands.

**2. Interactive Session (Proposed Model)**
- The user starts a session (`neurolink`).
- The application enters a persistent loop, presenting a prompt (`neurolink>`).
- The user enters commands one at a time.
- The application evaluates each command, prints the result, and loops back to the prompt.
- The session retains context between commands.

This transforms the CLI from a simple tool into a development environment.

---

## Why Integrate an Interactive Mode?

### Primary Benefits

**1. Enhanced Developer Experience & Productivity**
- **Rapid Iteration**: Users can test different models, providers, and prompts in quick succession without the overhead of restarting the Node.js process each time.
- **Reduced Friction**: Eliminates the need to repeatedly type `neurolink` for every command.

**2. Foundation for Stateful Features**
- **Conversation History**: An interactive session is a prerequisite for implementing conversational AI, where the context of previous interactions is maintained.
- **Session Variables**: Allows for setting session-wide configurations (e.g., `set provider=openai`) that persist until the session ends.

**3. Parity with Modern AI CLIs**
- Aligns NeuroLink with the user experience of leading AI tools like those from Google (Gemini), OpenAI, and other interactive database clients.

---

## How We Will Achieve It

### The Dual-Mode CLI Architecture

```
User Input → CLI Entry Point (index.ts)
              |
              ├─ (With Arguments)───→ Single-Shot Execution (Current Flow)
              |
              └─ (No Arguments)────→ Interactive Session Manager (New Flow)
                                        │
                                        ├─ Input Loop (inquirer)
                                        ├─ Command Parser (yargs)
                                        ├─ State Manager
                                        └─ Output Formatter
```

### Core Components

**1. Mode-Switcher (`index.ts`)**
- **Purpose**: To determine whether to run in single-shot or interactive mode.
- **Logic**: Checks the length of `process.argv`. If no command is present, it launches the interactive session.

**2. Interactive Session Manager (`interactiveSession.ts`)**
- **Purpose**: To manage the entire lifecycle of the REPL.
- **Responsibilities**:
    - Initialize and manage the main `while` loop.
    - Use `inquirer` to display the prompt and capture user input.
    - Pass the input string to a specially configured `yargs` instance for parsing.
    - Execute the command, catch any errors, and display results.
    - Manage a `sessionContext` object for state.

**3. Decoupled Command Handlers (`commandFactory.ts`)**
- **Purpose**: To make command logic reusable in both single-shot and interactive modes.
- **Refactoring**: Handlers will be modified to `throw` errors instead of calling `process.exit()` and `return` results instead of printing them directly.

---

## Approaches We Considered

### Approach 1: Simple Loop with Manual Parsing
- **Core Idea**: Use a `while` loop with Node.js's `readline` module and manually parse the input string with `split(' ')`.
- **Benefits**: No external dependencies, simple to understand.
- **Drawbacks**: Extremely brittle. Fails to handle quoted strings, flags, and complex arguments that `yargs` handles automatically. Re-implementing this logic is infeasible.
- **Complexity**: Low (Initial), Very High (To make robust) | **Risk**: High

### Approach 2: Dedicated REPL Framework
- **Core Idea**: Integrate a library like `vorpal.js`.
- **Benefits**: Provides a complete, feature-rich REPL framework out of the box.
- **Drawbacks**: Adds a large, opinionated dependency. Requires rewriting all command definitions to fit the new framework's API, abandoning the existing `yargs` setup.
- **Complexity**: High | **Risk**: Medium

### Approach 3: `yargs` within an Interactive Loop (Chosen)
- **Core Idea**: Use `inquirer` for the input loop and reuse the existing `yargs` instance to parse the input string within that loop.
- **Benefits**:
    - ✅ **Maximum Code Reuse**: Leverages all existing command definitions, options, and validation logic.
    - ✅ **Consistent Behavior**: Ensures commands behave identically in both modes.
    - ✅ **Low Dependency Impact**: Uses `inquirer`, which is already a dependency.
- **Drawbacks**: Requires careful configuration of `yargs` to prevent it from exiting the process on errors or help requests.
- **Complexity**: Medium | **Risk**: Low

---

## What We Chose and Why

We have chosen **Approach 3: `yargs` within an Interactive Loop**.

This hybrid approach provides the best balance of functionality, risk, and development effort. It allows us to deliver a robust interactive experience while maximizing our investment in the existing `yargs` command structure. The primary challenge is taming `yargs`'s process-terminating behavior, but this is a solvable configuration problem that is far less risky than rewriting our entire command system for a new framework.

---

## Implementation Details

### Architecture Diagram

```
+--------------------------------+
|      src/cli/index.ts          |
| (Main Entry Point & Mode-Switcher) |
+--------------------------------+
              |
  (argv.length === 0 ?) --YES-- |
              |                 |
             NO                 v
              |   +----------------------------------+
              |   |  src/cli/interactiveSession.ts   |
              |   |      (Session Manager)           |
              |   +----------------------------------+
              |                 |
              v                 v (while loop)
+--------------------------------+  +----------------------------------+
|    Single-Shot Execution       |  |  inquirer.prompt('neurolink> ')  |
|       (await cli.parse())      |  +----------------------------------+
+--------------------------------+                |
                                                  v
                                  +----------------------------------+
                                  | yargs.parse(userInput)           |
                                  | (non-terminating instance)       |
                                  +----------------------------------+
                                                  |
                                                  v
+--------------------------------------------------------------------+
|                     src/cli/factories/commandFactory.ts              |
|                  (Decoupled, Reusable Command Handlers)              |
|                  (throw errors, return results)                      |
+--------------------------------------------------------------------+
```

### New Components

#### `src/lib/utils/errors.ts` (New Utility File)
To break the circular dependency between `index.ts` and `interactiveSession.ts`, the `handleError` function will be extracted into its own module. This makes the architecture more robust and modular.

```typescript
// src/lib/utils/errors.ts
import chalk from 'chalk';
import { logger } from './logger.js';
import {
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  RateLimitError,
} from '../types/errors.js';

// This function is moved from index.ts
export function handleError(_error: Error, context: string, shouldExit = true): void {
  logger.error(chalk.red(`❌ ${context} failed: ${_error.message}`));

  if (_error instanceof AuthenticationError) {
    // ... detailed help messages would be here ...
  } else if (_error instanceof RateLimitError) {
    // ...
  } else if (_error instanceof AuthorizationError) {
    // ...
  } else if (_error instanceof NetworkError) {
    // ...
  }

  if (shouldExit) {
    process.exit(1);
  }
}
```

#### `src/cli/interactiveSession.ts`
This new file will manage the REPL. It will use `string-argv` for robust command tokenization.

**Note**: This requires adding `string-argv` to the production `dependencies` in `package.json`.

```typescript
// src/cli/interactiveSession.ts
import inquirer from 'inquirer';
import yargs from 'yargs';
import chalk from 'chalk';
import toArgv from 'string-argv';
import { logger } from '../lib/utils/logger.js';
import { handleError } from './index.js';

export class InteractiveSession {
  private yargsInstance: yargs.Argv;
  private isRunning = false;

  constructor(cli: yargs.Argv) {
    this.yargsInstance = cli
      .scriptName('') // Hide script name in interactive mode
      .fail((msg, err) => {
        // CRITICAL: Instead of exiting, throw an error for the loop to catch.
        throw err || new Error(msg);
      })
      .exitProcess(false); // Explicitly disable process exit
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    logger.always(chalk.bold.green('Welcome to the NeuroLink Interactive Session!'));
    logger.always(chalk.gray('Type "exit" or use Ctrl+C to quit.'));

    while (this.isRunning) {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'command',
            message: chalk.blue.bold('neurolink>'),
          },
        ]);

        const command = answers.command.trim();
        if (command.toLowerCase() === 'exit' || command.toLowerCase() === 'quit') {
          this.isRunning = false;
          continue;
        }
        if (!command) continue;

        // Use a robust tokenizer to convert the string to an argv array
        const argv = toArgv(command);
        
        // Use parseAsync, which is designed for async handlers and returns a promise
        await this.yargsInstance.parseAsync(argv);

      } catch (error) {
        // Our loop catches the error and uses the non-terminating handleError.
        handleError(error as Error, 'Command Failed', false);
      }
    }
    logger.always(chalk.yellow('Exiting session.'));
  }
}
```

### Files to Modify

#### `src/cli/index.ts`
The entry point needs to be updated to switch between modes and make `handleError` more flexible.

```typescript
// src/cli/index.ts

// ... imports

// MODIFICATION: Add `shouldExit` parameter
export function handleError(_error: Error, context: string, shouldExit = true): void {
  logger.error(chalk.red(`❌ ${context} failed: ${_error.message}`));
  // ... existing detailed error logging ...
  if (shouldExit) {
    process.exit(1);
  }
}

// ... yargs setup ...
const cli = yargs(hideBin(process.argv))
  // ... existing configuration ...

// MAIN EXECUTION LOGIC
export async function main(): Promise<void> {
  try {
    const argv = hideBin(process.argv);
    if (argv.length === 0) {
      // MODE: INTERACTIVE
      const { InteractiveSession } = await import('./interactiveSession.js');
      const session = new InteractiveSession(cli);
      await session.start();
    } else {
      // MODE: SINGLE-SHOT (Backward Compatible)
      await cli.parseAsync();
    }
  } catch (error) {
    // This global catch handles errors from single-shot mode.
    handleError(error as Error, 'CLI Execution');
  }
}

// Execute only when this file is run directly
import { pathToFileURL } from 'node:url';
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
```

#### `src/cli/factories/commandFactory.ts`
All `catch` blocks in command handlers must be refactored.

```typescript
// Example for `executeGenerate`
// ... inside the handler's try...catch block

// ------- SEARCH
    } catch (error) {
      if (spinner) {
        spinner.fail();
      }
      handleError(error as Error, "Generation");
    }
// =======
// REPLACEMENT
    } catch (error) {
      if (spinner) {
        spinner.fail();
      }
      // Re-throw the error to be caught by the execution context (loop or main process)
      throw error;
    }
// +++++++ REPLACE
```
This change needs to be applied to **all** command handlers (`executeStream`, `executeBatch`, `executeProviderStatus`, etc.).

---

## Risks and Mitigation

- **Risk 1**: `yargs` has deeply nested logic that may still call `process.exit()` (e.g., for `--version` or `--help`).
  - **Mitigation**: The `exitProcess(false)` method is the official way to prevent this. We will add specific tests to verify that `--help` and `--version` flags are handled correctly within the loop without terminating the session. We can override the behavior for these flags to simply log to the console.

- **Risk 2**: Asynchronous UI artifacts (like `ora` spinners) are not properly cleaned up on error.
  - **Mitigation**: The `try...catch` block within the `InteractiveSession` loop is the ideal place to implement cleanup logic. We will ensure any active spinner is stopped in the `catch` block before the error is printed.

- **Risk 3**: The concept of `stdin` becomes ambiguous in an interactive loop.
  - **Mitigation**: We will disable `stdin` processing when in interactive mode. The `isTTY` check will be augmented with a session-level flag. We will document that in interactive mode, input must be provided as a direct argument (e.g., `generate "My prompt"`).
