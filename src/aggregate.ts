import type {
  AggregateStats,
  ComparisonRow,
  GroupedStats,
  UsageEvent,
} from "./types.js";

export function emptyStats(): AggregateStats {
  return {
    calls: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    totalLatencyMs: 0,
    avgLatencyMs: 0,
  };
}

export function finalizeStats(stats: AggregateStats): AggregateStats {
  return {
    ...stats,
    costUsd: Number(stats.costUsd.toFixed(8)),
    avgLatencyMs:
      stats.calls > 0
        ? Number((stats.totalLatencyMs / stats.calls).toFixed(3))
        : 0,
  };
}

export function aggregate(events: UsageEvent[]): AggregateStats {
  const stats = emptyStats();
  for (const e of events) {
    stats.calls += 1;
    stats.promptTokens += e.promptTokens;
    stats.completionTokens += e.completionTokens;
    stats.totalTokens += e.totalTokens;
    stats.costUsd += e.costUsd;
    stats.totalLatencyMs += e.latencyMs;
  }
  return finalizeStats(stats);
}

export function groupBy(
  events: UsageEvent[],
  keyFn: (e: UsageEvent) => string,
): GroupedStats[] {
  const map = new Map<string, AggregateStats>();
  for (const e of events) {
    const key = keyFn(e);
    const stats = map.get(key) ?? emptyStats();
    stats.calls += 1;
    stats.promptTokens += e.promptTokens;
    stats.completionTokens += e.completionTokens;
    stats.totalTokens += e.totalTokens;
    stats.costUsd += e.costUsd;
    stats.totalLatencyMs += e.latencyMs;
    map.set(key, stats);
  }
  return [...map.entries()]
    .map(([key, stats]) => ({ key, ...finalizeStats(stats) }))
    .sort((a, b) => b.costUsd - a.costUsd);
}

export function toComparison(rows: GroupedStats[]): ComparisonRow[] {
  return rows.map((r) => ({
    key: r.key,
    calls: r.calls,
    totalTokens: r.totalTokens,
    costUsd: r.costUsd,
    avgLatencyMs: r.avgLatencyMs,
    costPer1kTokens:
      r.totalTokens > 0
        ? Number(((r.costUsd / r.totalTokens) * 1000).toFixed(8))
        : 0,
  }));
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}
