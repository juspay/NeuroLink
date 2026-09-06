# Proxy incident reliability verification

This change addresses worker termination after delayed IPC commits, missing
admission evidence after worker death, misleading analysis windows, bulk capture
work on the serving event loop, and lost transport-error attribution.

## Acceptance evidence

Local verification on macOS, Node 24.14.1, September 7, 2026. All network fixtures
use ephemeral loopback listeners and isolated storage. No installed proxy,
provider account, launchd service, or production request was used.

| Requirement                                               | Evidence                                                                                                                                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delayed acceptance gets its own full commit deadline      | Actual child-process IPC fixture; no failed transfer or worker replacement                                                                                                               |
| A failed commit preserves unrelated streams               | Actual shipped worker runtime; affected connection closes, other stream delivers every byte, replacement serves requests; commit timeouts and IPC write failures retain distinct reasons |
| Accepted work remains identifiable after worker death     | Confirmed admission append, fixture SIGKILL, independent parent exit journal, built analyzer joins by process instance                                                                   |
| Unknown outcomes remain unknown                           | Missing terminal plus worker exit is reported as `unconfirmedAtWorkerExit`; conflicting exit evidence is excluded                                                                        |
| Storage failures cannot dispatch unrecorded upstream work | HTTP fixture returns classified 503 after admission write failure; upstream invocation count stays zero                                                                                  |
| Time-window analysis does not fabricate sequence gaps     | Excluded requests between selected events still participate in sequence auditing; auxiliary requests have separate HTTP accounting                                                       |
| Capture work stays bounded and reconstructable            | Real worker-thread capture, gzip/hash validation, secret redaction, UTF-8 truncation, queue saturation, slow publication sink and worker failure accounting                              |
| Transport attribution and safe retry                      | Two-account HTTP fixtures: EPIPE and ambiguous socket loss stop after one attempt; connect timeout can rotate; final cause/account match the last attempt                                |
| Burst admission is exact                                  | 150 concurrent connections, 150 completed bodies, 150 unique persisted admissions, no rejected or failed handoffs                                                                        |
| Status rows and fallback routing remain correct           | Built status CLI emits each qualified account once; recorded fallback requests retain `gpt-6-astra` and `xhigh`                                                                          |

Commands and results:

- `pnpm run test:proxy-telemetry`: 41 passed.
- `pnpm run test:browser-bundle`: 6 passed, including callback and cancellation behavior without Node globals.
- `pnpm run check` and `pnpm run check:tools-tests`: passed, including strict types for the test fixtures.
- `pnpm run test:codex`: 69 passed.
- `pnpm run test:proxy-connect-retry`: 5 passed.
- `NEUROLINK_PROXY_TEST_ALLOW_LIVE=0 pnpm run test:proxy`: 97 passed, 7 live-provider cases skipped.
- `pnpm run build`: package, CLI, browser bundle and publint passed. Library changes require the full package build; `build:cli` alone can retain an older library artifact.

## Performance observations

The existing lifecycle gate wrote 100,000 events for 25,000 requests with zero
drops or uncertain writes. Enqueue p95 was 12 microseconds; added response-tracking
p95 was 49 microseconds. The statistics gate reconciled 50,000 requests exactly.
The loopback transport gate added 1.69 ms p95 against its 5 ms budget.

The first rolling gate preserved all traffic but failed the sustained latency
budget: 51.28 ms added p95 against 25 ms. We then ran three alternating comparisons
against unchanged release `382217975c39433df058e2b2c2fb91b283230725`, using the
same fixture, machine and background scheduling priority. No budgets were changed.

| Round | Release added p95 under sustained load | Patched added p95 under sustained load |
| ----- | -------------------------------------: | -------------------------------------: |
| 1     |                               6.042 ms |                              24.840 ms |
| 2     |                               6.826 ms |                               5.355 ms |
| 3     |                               9.827 ms |                               4.811 ms |

Every comparison passed the existing budgets, preserved the active stream, and
reported zero dropped requests. The fixture includes 100 concurrent handoff
requests and 64-way sustained traffic. These observations expose variability;
they do not certify a latency ceiling under arbitrary host contention.

## Interpretation limits

Admission durability means an OS-acknowledged append survives serving-process
death. It is not an fsync, machine-failure, or end-client-delivery guarantee.
Terminal tails, retention, full disks, backend export failures and upstream
quotas can still produce missing evidence or failed requests. Their states must
remain explicit rather than being converted into success or an invented cause.

Bulk captures can be rejected by their documented queue/size limits. They retain
failure indexes and counters; metadata admission is independent. Sensitive keys
are redacted regardless of value type in objects and JSON text. Current-day
supervisor journals remain protected during size cleanup, and permission failures
keep the lifecycle sink disabled while the admission requirement remains active. Capture count and
byte capacity remain reserved until index writes and OTLP publication finish, so
a slow sink cannot accumulate an unbounded backlog of completed bodies. The
default request-log shutdown flush has a 30-second budget covering the 20-second
worker deadline and index/export publication; the CLI uses that same budget. Provider latency
and quota behavior require separately authorized production observation after a
release is installed. A PR or synthetic benchmark does not establish live adoption.
