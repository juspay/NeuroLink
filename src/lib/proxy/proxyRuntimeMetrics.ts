import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import { availableParallelism, loadavg } from "node:os";
import type { ProxyRuntimeSample } from "../types/index.js";

/** Samples use actual elapsed time, including delayed timers under host load. */
export function startProxyRuntimeMetrics(
  emit: (sample: ProxyRuntimeSample) => void,
): () => void {
  const histogram = monitorEventLoopDelay({ resolution: 20 });
  histogram.enable();
  let previousCpu = process.cpuUsage();
  let previousTime = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    const cpu = process.cpuUsage();
    const intervalMs = now - previousTime;
    emit({
      intervalMs,
      cpuPercentOneCore:
        ((cpu.user - previousCpu.user + cpu.system - previousCpu.system) /
          (intervalMs * 1000)) *
        100,
      rssBytes: process.memoryUsage().rss,
      heapUsedBytes: process.memoryUsage().heapUsed,
      eventLoopDelayP99Ms: histogram.count ? histogram.percentile(99) / 1e6 : 0,
      eventLoopDelayMaxMs: histogram.count ? histogram.max / 1e6 : 0,
      hostLoad1m: loadavg()[0],
      availableParallelism: availableParallelism(),
    });
    previousCpu = cpu;
    previousTime = now;
    histogram.reset();
  }, 10_000);
  timer.unref();
  return () => {
    clearInterval(timer);
    histogram.disable();
  };
}
