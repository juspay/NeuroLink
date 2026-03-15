# Remove Redundant Test Cases - Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all vitest test files and infrastructure, keeping only the 14 continuous test suites and their dependencies.

**Architecture:** Delete all `.test.ts` files, vitest-only support files, unused fixtures, and empty directories. Update package.json scripts to point to continuous suites. Clean up vitest.config.ts and CI references.

**Tech Stack:** Shell (deletion), JSON editing (package.json), TypeScript config editing

---

## Chunk 1: Delete Vitest Test Files

### Task 1: Delete test/unit/ directory (63 test files)

**Files:**

- Delete: `test/unit/` (entire directory tree)

- [ ] **Step 1: Delete the entire test/unit directory**

```bash
rm -rf test/unit/
```

- [ ] **Step 2: Verify deletion**

```bash
ls test/unit/ 2>&1
# Expected: "No such file or directory"
```

---

### Task 2: Delete test/suites/ directory (6 test files)

**Files:**

- Delete: `test/suites/` (entire directory tree)

- [ ] **Step 1: Delete the entire test/suites directory**

```bash
rm -rf test/suites/
```

- [ ] **Step 2: Verify deletion**

```bash
ls test/suites/ 2>&1
# Expected: "No such file or directory"
```

---

### Task 3: Delete test/integration/ directory (6 test files)

**Files:**

- Delete: `test/integration/` (entire directory tree)

- [ ] **Step 1: Delete the entire test/integration directory**

```bash
rm -rf test/integration/
```

- [ ] **Step 2: Verify deletion**

```bash
ls test/integration/ 2>&1
# Expected: "No such file or directory"
```

---

### Task 4: Delete test/rag/ test files (9 test files, keep fixtures/rag/)

**Files:**

- Delete: `test/rag/ChunkerFactory.test.ts`
- Delete: `test/rag/ChunkerRegistry.test.ts`
- Delete: `test/rag/markdown-table-chunking.test.ts`
- Delete: `test/rag/multifile-diversity.test.ts`
- Delete: `test/rag/rag-stream-integration.test.ts`
- Delete: `test/rag/ragIntegration.test.ts`
- Delete: `test/rag/integration/` (directory)
- Delete: `test/rag/resilience/` (directory)

- [ ] **Step 1: Delete RAG test files and subdirectories**

```bash
rm -f test/rag/ChunkerFactory.test.ts test/rag/ChunkerRegistry.test.ts test/rag/markdown-table-chunking.test.ts test/rag/multifile-diversity.test.ts test/rag/rag-stream-integration.test.ts test/rag/ragIntegration.test.ts
rm -rf test/rag/integration/ test/rag/resilience/
```

- [ ] **Step 2: Verify only empty directory remains, then remove it**

```bash
ls test/rag/
# Expected: empty directory
rmdir test/rag/
```

---

### Task 5: Delete remaining test directories with test files

**Files:**

- Delete: `test/adapters/` (entire tree)
- Delete: `test/multimodal/` (entire tree)
- Delete: `test/sdk/` (entire tree)
- Delete: `test/providers/` (entire tree)
- Delete: `test/server/` (entire tree)

- [ ] **Step 1: Delete all remaining test directories**

```bash
rm -rf test/adapters/ test/multimodal/ test/sdk/ test/providers/ test/server/
```

- [ ] **Step 2: Verify deletion**

```bash
for dir in test/adapters test/multimodal test/sdk test/providers test/server; do ls "$dir" 2>&1; done
# Expected: all "No such file or directory"
```

---

### Task 6: Delete test files outside test/ directory

**Files:**

- Delete: `src/lib/workflow/__tests__/workflow.test.ts`
- Delete: `src/lib/workflow/__tests__/` (directory)
- Delete: `examples/projects/enterprise-app/tests/integration.test.ts`
- Delete: `examples/projects/enterprise-app/tests/` (directory)

- [ ] **Step 1: Delete external test files**

```bash
rm -rf src/lib/workflow/__tests__/
rm -rf examples/projects/enterprise-app/tests/
```

---

## Chunk 2: Delete Support Files and Unused Fixtures

### Task 7: Delete vitest-only support files (9 files)

**Files:**

- Delete: `test/setup.ts`
- Delete: `test/types/global.ts`
- Delete: `test/types/` (directory, after global.ts removed - keep mcp.ts!)
- Delete: `test/utils/server-test-utils.ts`
- Delete: `test/utils/continuousTestHelpers.ts`
- Delete: `test/utils/` (directory)
- Delete: `test/debug-redis-write.mts`
- Delete: `test/audit/agent-test-tracing-journey.ts`
- Delete: `test/audit/` (directory)
- Delete: `test/file-processor-test-suite.ts`
- Delete: `test/global-endpoint-tests.ts`

- [ ] **Step 1: Delete support files (preserve test/types/mcp.ts!)**

```bash
rm -f test/setup.ts test/debug-redis-write.mts test/file-processor-test-suite.ts test/global-endpoint-tests.ts
rm -f test/types/global.ts
rm -rf test/utils/ test/audit/
```

- [ ] **Step 2: Verify mcp.ts is preserved**

```bash
ls test/types/mcp.ts
# Expected: file exists
```

---

### Task 8: Delete unused fixture directories (9 directories)

**Files:**

- Delete: `test/fixtures/archive/`
- Delete: `test/fixtures/audio/`
- Delete: `test/fixtures/code/`
- Delete: `test/fixtures/document/`
- Delete: `test/fixtures/ebook/`
- Delete: `test/fixtures/font/`
- Delete: `test/fixtures/image/`
- Delete: `test/fixtures/media/`
- Delete: `test/fixtures/video/`

- [ ] **Step 1: Delete unused fixture directories**

```bash
rm -rf test/fixtures/archive/ test/fixtures/audio/ test/fixtures/code/ test/fixtures/document/ test/fixtures/ebook/ test/fixtures/font/ test/fixtures/image/ test/fixtures/media/ test/fixtures/video/
```

- [ ] **Step 2: Verify kept fixtures remain**

```bash
ls test/fixtures/rag/ test/fixtures/servers/
ls test/fixtures/transactions.csv test/fixtures/merchant-summary.csv test/fixtures/valid-sample.pdf test/fixtures/multi-page.pdf test/fixtures/sample-screenshot.png test/fixtures/meta-ads-campaign-performance.csv test/fixtures/meta-ads-account-metrics.json test/fixtures/zod-sample.ts
# Expected: all exist
```

---

### Task 9: Delete unused individual fixture files (17 files)

**Files:**

- Delete: `test/fixtures/basic.csv`
- Delete: `test/fixtures/escaped.csv`
- Delete: `test/fixtures/quoted.csv`
- Delete: `test/fixtures/sample.tsv`
- Delete: `test/fixtures/large.csv`
- Delete: `test/fixtures/malformed.csv`
- Delete: `test/fixtures/not-a-csv`
- Delete: `test/fixtures/invalid.pdf`
- Delete: `test/fixtures/extensionless-csv-1`
- Delete: `test/fixtures/extensionless-csv-2`
- Delete: `test/fixtures/extensionless-json-1`
- Delete: `test/fixtures/extensionless-json-2`
- Delete: `test/fixtures/extensionless-xml`
- Delete: `test/fixtures/extensionless-yaml`
- Delete: `test/fixtures/file-1`
- Delete: `test/fixtures/file-2`
- Delete: `test/fixtures/file-3`

- [ ] **Step 1: Delete unused fixture files**

```bash
rm -f test/fixtures/basic.csv test/fixtures/escaped.csv test/fixtures/quoted.csv test/fixtures/sample.tsv test/fixtures/large.csv test/fixtures/malformed.csv test/fixtures/not-a-csv test/fixtures/invalid.pdf test/fixtures/extensionless-csv-1 test/fixtures/extensionless-csv-2 test/fixtures/extensionless-json-1 test/fixtures/extensionless-json-2 test/fixtures/extensionless-xml test/fixtures/extensionless-yaml test/fixtures/file-1 test/fixtures/file-2 test/fixtures/file-3
```

---

## Chunk 3: Update Configuration Files

### Task 10: Update package.json test scripts

**Files:**

- Modify: `package.json` (lines 62-77)

- [ ] **Step 1: Replace vitest test scripts with continuous suite scripts**

Replace the "Testing" section (lines 62-77) with:

```json
"// Testing (Continuous Test Suites)": "",
"test": "npx tsx test/continuous-test-suite.ts",
"test:context": "npx tsx test/continuous-test-suite-context.ts",
"test:evaluation": "npx tsx test/continuous-test-suite-evaluation.ts",
"test:mcp": "npx tsx test/continuous-test-suite-mcp-http.ts",
"test:media": "npx tsx test/continuous-test-suite-media-gen.ts",
"test:memory": "npx tsx test/continuous-test-suite-memory.ts",
"test:observability": "npx tsx test/continuous-test-suite-observability.ts",
"test:ppt": "npx tsx test/continuous-test-suite-ppt.ts",
"test:providers": "npx tsx test/continuous-test-suite-providers.ts",
"test:rag": "npx tsx test/continuous-test-suite-rag.ts",
"test:servers": "npx tsx test/continuous-test-suite-servers.ts",
"test:tracing": "npx tsx test/continuous-test-suite-tracing.ts",
"test:tts": "npx tsx test/continuous-test-suite-tts.ts",
"test:workflow": "npx tsx test/continuous-test-suite-workflow.ts",
"test:performance": "tsx tools/testing/performanceMonitor.ts",
```

- [ ] **Step 2: Remove legacy test scripts**

Remove these lines:

```json
"test:legacy": "npx tsx test/continuous-test-suite.ts",
"test:comparison": "pnpm run test && pnpm run test:legacy",
```

- [ ] **Step 3: Update pre-push script reference**

On line 119, change:

```json
"pre-push": "pnpm run validate:commit && pnpm run validate:env && pnpm run validate && pnpm run test",
```

to:

```json
"pre-push": "pnpm run validate:commit && pnpm run validate:env && pnpm run validate",
```

(Remove `pnpm run test` from pre-push since continuous suites need API keys and shouldn't run on every push)

---

### Task 11: Clean up vitest.config.ts

**Files:**

- Modify: `vitest.config.ts`

- [ ] **Step 1: Strip test configuration, keep only resolve aliases**

Replace vitest.config.ts content with minimal config that preserves resolve aliases for any remaining build tooling:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Path resolution for imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./test"),
    },
  },
});
```

---

### Task 12: Update CI workflow

**Files:**

- Modify: `.github/workflows/ci.yml` (line 65)

- [ ] **Step 1: Update ESLint test directory linting**

On line 65, change:

```yaml
npx eslint test/ --max-warnings=10
```

to:

```yaml
npx eslint test/continuous-test-suite*.ts test/zod-schema-test-function.ts --max-warnings=10
```

- [ ] **Step 2: Update quality-gate coverage step**

On lines 259-263, change:

```yaml
- name: 🎯 Code Coverage Analysis
  run: |
    echo "🎯 Running tests with coverage..."
    pnpm run test:run --coverage || echo "Tests completed with warnings"
  continue-on-error: true
```

to:

```yaml
- name: 🎯 Test Suite Validation
  run: |
    echo "🎯 Continuous test suites are run separately with API keys"
    echo "Skipping automated test execution in CI"
  continue-on-error: true
```

---

## Chunk 4: Verification

### Task 13: Verify final state

- [ ] **Step 1: Verify no .test.ts files remain**

```bash
find test/ -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null
find src/ -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null
# Expected: no output
```

- [ ] **Step 2: Verify all 14 continuous suites exist**

```bash
ls test/continuous-test-suite*.ts | wc -l
# Expected: 14
```

- [ ] **Step 3: Verify dependencies exist**

```bash
ls test/zod-schema-test-function.ts test/types/mcp.ts test/fixtures/zod-sample.ts
# Expected: all exist
```

- [ ] **Step 4: Verify fixtures exist**

```bash
ls test/fixtures/rag/ test/fixtures/servers/ test/fixtures/transactions.csv test/fixtures/merchant-summary.csv test/fixtures/valid-sample.pdf test/fixtures/multi-page.pdf test/fixtures/sample-screenshot.png
# Expected: all exist
```

- [ ] **Step 5: Verify build still works**

```bash
pnpm run build
# Expected: success
```

- [ ] **Step 6: Verify TypeScript compilation**

```bash
npx tsc --noEmit --strict --project tsconfig.json
# Expected: 0 TypeScript errors
```

- [ ] **Step 7: Verify test/ directory is clean**

```bash
ls test/
# Expected: only continuous-test-suite*.ts, zod-schema-test-function.ts, fixtures/, types/, shell scripts, TESTING_SCRIPTS.md, and test-all-providers.sh / run-all-providers-sequential.sh
```
