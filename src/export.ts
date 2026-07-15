import type { UsageEvent } from "./types.js";

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Export usage events as CSV.
 */
export function toCSV(events: UsageEvent[]): string {
  const headers = [
    "id",
    "timestamp",
    "provider",
    "model",
    "promptTokens",
    "completionTokens",
    "totalTokens",
    "latencyMs",
    "costUsd",
    "requestId",
  ];
  const lines = [headers.join(",")];
  for (const e of events) {
    lines.push(
      [
        e.id,
        e.timestamp,
        e.provider,
        e.model,
        e.promptTokens,
        e.completionTokens,
        e.totalTokens,
        e.latencyMs,
        e.costUsd,
        e.requestId ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}

/**
 * Export usage events / reports as pretty JSON.
 */
export function toJSON(data: unknown, pretty = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}
