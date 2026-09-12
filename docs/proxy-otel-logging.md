# Proxy logging through OpenTelemetry

The default remains file logging plus the existing OTLP request/body export.
To use only OTLP for proxy application logs, set these variables in the proxy
environment file before starting the service:

```dotenv
NEUROLINK_PROXY_LOG_SINK=otel
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:14318
```

`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` can override the complete logs URL, including
`/v1/logs`. Remote collectors require HTTPS; HTTP is limited to loopback.
A missing or invalid endpoint fails initialization; it does not
silently switch back to disk. Verify the collector and its backend before
switching the service. Changing a running supervisor's sink requires replacing
the supervisor. A worker-only reload cannot change the old supervisor's sink.

In this mode:

- Request finals retain their dashboard attributes and complete structured
  metadata in the log body. `proxy.record_kind=request_final` identifies them.
- Attempts, lifecycle/runtime/supervisor events, stream errors and body indexes
  have distinct record kinds and do not carry final-request success fields.
- Redacted body processing remains in the bounded body worker. It skips gzip,
  artifact writes and the debug index file, and exports redacted chunks directly.
- Request admission submits lifecycle evidence asynchronously. Collector latency,
  queue overflow and outages do not cause telemetry admission HTTP 503s.
- Proxy application console diagnostics go to OTel. Updater/guard file descriptors
  and the file retention scanner are disabled. A launchd installation created in
  this mode uses `/dev/null` for stdout/stderr. Existing installations need their
  plist updated as part of the supervised cutover. Ambient OTel sink, endpoint
  and exporter header settings are retained in a private launchd plist.
- Existing historical logs are preserved. Credentials, quota, accounting and
  supervisor state are operational persistence and continue to be stored.

Metadata has a 2,048-record queue; redacted body chunks have an independent
256-record queue. Outstanding counts include exports in flight. This prevents
bulk body capture from exhausting metadata capacity. Export batches are capped
at 64 records and transport timeouts at five seconds.

`/status` exposes the selected sink and per-process export counters under request
logging observability. `submitted` means admitted to the memory queue;
`transportAcknowledged` means the SDK reported HTTP export success. It does not
prove individual record acceptance or backend persistence. `exportUnconfirmed`
means an export failed or could not be confirmed; it may have reached the
collector before a connection failed. `dropped` counts local queue overflow.
Reconcile these with collector counters and queries for correlated request IDs
in the backend. Do not claim exactly-once or lossless delivery from HTTP success.

An in-memory pipeline can lose evidence during an outage or abrupt process exit.
Native runtime output emitted outside application console methods is discarded
by `/dev/null`; the supervisor still records worker exits. Set collector queue,
retry, memory and backend retention limits deliberately. A collector/backend may
still persist telemetry; this mode removes proxy log files, not backend storage.

The local `proxy analyze`, `proxy replay` and file-based account ledger commands
read historical files. They do not query the collector and cannot describe new
OTel-only traffic. Use the telemetry backend for that interval.

For rollback, restore the previous service environment and launchd configuration,
then replace the supervisor with the previous runtime after draining requests.
Removing `NEUROLINK_PROXY_LOG_SINK=otel` restores the default file behavior.
