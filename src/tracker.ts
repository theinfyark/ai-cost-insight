import { randomUUID } from "node:crypto";
import type {
  AggregateStats,
  ComparisonRow,
  PeriodReport,
  PriceRate,
  UsageEvent,
  UsageEventInput,
} from "./types.js";
import { calculateCost, DEFAULT_PRICING } from "./pricing.js";
import {
  aggregate,
  dayKey,
  groupBy,
  monthKey,
  toComparison,
} from "./aggregate.js";
import { toCSV, toJSON } from "./export.js";

export interface AICostInsightOptions {
  /** Custom pricing tables (USD / 1M tokens). */
  pricing?: Record<string, Record<string, PriceRate>>;
  /** Optional sink called on every tracked event. */
  onTrack?: (event: UsageEvent) => void;
}

/**
 * Universal AI cost and token usage tracker.
 *
 * @example
 * ```ts
 * const insight = new AICostInsight();
 * insight.track({
 *   provider: "openai",
 *   model: "gpt-4o-mini",
 *   promptTokens: 120,
 *   completionTokens: 80,
 *   latencyMs: 340,
 * });
 * console.log(insight.summary());
 * console.log(insight.dailyReport());
 * ```
 */
export class AICostInsight {
  private events: UsageEvent[] = [];
  private readonly pricing: Record<string, Record<string, PriceRate>>;
  private readonly onTrack?: (event: UsageEvent) => void;

  constructor(options: AICostInsightOptions = {}) {
    this.pricing = options.pricing ?? DEFAULT_PRICING;
    this.onTrack = options.onTrack;
  }

  /**
   * Record a model call.
   */
  track(input: UsageEventInput): UsageEvent {
    if (!input.provider) throw new Error("provider is required");
    if (!input.model) throw new Error("model is required");
    if (!Number.isFinite(input.promptTokens) || !Number.isFinite(input.completionTokens)) {
      throw new Error("token counts must be finite numbers");
    }
    if (input.promptTokens < 0 || input.completionTokens < 0) {
      throw new Error("token counts must be >= 0");
    }
    if (input.costUsd !== undefined && !Number.isFinite(input.costUsd)) {
      throw new Error("costUsd must be a finite number");
    }

    const timestamp = (
      input.timestamp instanceof Date
        ? input.timestamp
        : input.timestamp
          ? new Date(input.timestamp)
          : new Date()
    );
    if (Number.isNaN(timestamp.getTime())) {
      throw new Error("timestamp must be a valid date");
    }

    const costUsd =
      input.costUsd ??
      calculateCost(
        input.provider,
        input.model,
        input.promptTokens,
        input.completionTokens,
        this.pricing,
      );

    const event: UsageEvent = {
      id: randomUUID(),
      provider: input.provider,
      model: input.model,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      totalTokens: input.promptTokens + input.completionTokens,
      latencyMs: input.latencyMs ?? 0,
      costUsd,
      timestamp: timestamp.toISOString(),
      ...(input.requestId ? { requestId: input.requestId } : {}),
      meta: input.meta ?? {},
    };

    this.events.push(event);
    this.onTrack?.(event);
    return event;
  }

  /** All recorded events (copy). */
  getEvents(): UsageEvent[] {
    return [...this.events];
  }

  /** Clear recorded events. */
  clear(): void {
    this.events = [];
  }

  /** Overall usage aggregation. */
  summary(): AggregateStats {
    return aggregate(this.events);
  }

  /** Provider comparison table. */
  compareProviders(): ComparisonRow[] {
    return toComparison(groupBy(this.events, (e) => e.provider));
  }

  /** Model comparison table. */
  compareModels(): ComparisonRow[] {
    return toComparison(
      groupBy(this.events, (e) => `${e.provider}/${e.model}`),
    );
  }

  /**
   * Daily reports (optionally filter by YYYY-MM-DD).
   */
  dailyReport(day?: string): PeriodReport[] {
    const groups = groupBy(this.events, (e) => dayKey(e.timestamp));
    const days = day ? groups.filter((g) => g.key === day) : groups;

    return days
      .map((g) => {
        const events = this.events.filter((e) => dayKey(e.timestamp) === g.key);
        return {
          period: g.key,
          stats: aggregate(events),
          byProvider: groupBy(events, (e) => e.provider),
          byModel: groupBy(events, (e) => `${e.provider}/${e.model}`),
          events,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Monthly reports (optionally filter by YYYY-MM).
   */
  monthlyReport(month?: string): PeriodReport[] {
    const groups = groupBy(this.events, (e) => monthKey(e.timestamp));
    const months = month ? groups.filter((g) => g.key === month) : groups;

    return months
      .map((g) => {
        const events = this.events.filter(
          (e) => monthKey(e.timestamp) === g.key,
        );
        return {
          period: g.key,
          stats: aggregate(events),
          byProvider: groupBy(events, (e) => e.provider),
          byModel: groupBy(events, (e) => `${e.provider}/${e.model}`),
          events,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /** Export events as CSV string. */
  toCSV(): string {
    return toCSV(this.events);
  }

  /** Export full snapshot as JSON string. */
  toJSON(pretty = true): string {
    return toJSON(
      {
        summary: this.summary(),
        providers: this.compareProviders(),
        models: this.compareModels(),
        daily: this.dailyReport().map(({ events: _e, ...rest }) => rest),
        monthly: this.monthlyReport().map(({ events: _e, ...rest }) => rest),
        events: this.events,
      },
      pretty,
    );
  }

  /** Import previously exported events (JSON array of UsageEvent). */
  importEvents(events: UsageEvent[]): void {
    if (!Array.isArray(events)) {
      throw new Error("importEvents() expects an array");
    }
    for (const e of events) {
      if (!e?.provider || !e?.model) {
        throw new Error("invalid usage event in import");
      }
      if (!Number.isFinite(e.promptTokens) || !Number.isFinite(e.completionTokens)) {
        throw new Error("imported token counts must be finite numbers");
      }
      if (e.promptTokens < 0 || e.completionTokens < 0) {
        throw new Error("imported token counts must be >= 0");
      }
      this.events.push({
        ...e,
        totalTokens: e.promptTokens + e.completionTokens,
        meta: e.meta ?? {},
      });
    }
  }
}
