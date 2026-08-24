import { describe, it, expect } from "vitest";
import {
  AICostInsight,
  calculateCost,
  toCSV,
} from "../src/index.js";

describe("ai-cost-insight", () => {
  it("tracks tokens, cost, and latency", () => {
    const insight = new AICostInsight();
    const event = insight.track({
      provider: "openai",
      model: "gpt-4o-mini",
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
      latencyMs: 250,
      requestId: "req_1",
    });

    expect(event.totalTokens).toBe(2_000_000);
    expect(event.costUsd).toBe(0.75);
    expect(event.latencyMs).toBe(250);
    expect(insight.summary().calls).toBe(1);
    expect(insight.summary().avgLatencyMs).toBe(250);
  });

  it("aggregates and compares providers/models", () => {
    const insight = new AICostInsight();
    insight.track({
      provider: "openai",
      model: "gpt-4o-mini",
      promptTokens: 100,
      completionTokens: 50,
      latencyMs: 100,
      timestamp: "2026-07-01T10:00:00.000Z",
    });
    insight.track({
      provider: "anthropic",
      model: "claude-3-5-haiku-latest",
      promptTokens: 100,
      completionTokens: 50,
      latencyMs: 200,
      timestamp: "2026-07-01T11:00:00.000Z",
    });
    insight.track({
      provider: "openai",
      model: "gpt-4o",
      promptTokens: 100,
      completionTokens: 50,
      latencyMs: 300,
      timestamp: "2026-07-02T09:00:00.000Z",
    });

    const providers = insight.compareProviders();
    expect(providers.some((p) => p.key === "openai")).toBe(true);
    expect(providers.some((p) => p.key === "anthropic")).toBe(true);

    const models = insight.compareModels();
    expect(models.length).toBe(3);
    expect(models[0]!.costPer1kTokens).toBeGreaterThanOrEqual(0);
  });

  it("builds daily and monthly reports", () => {
    const insight = new AICostInsight();
    insight.track({
      provider: "gemini",
      model: "gemini-2.0-flash",
      promptTokens: 10,
      completionTokens: 5,
      timestamp: "2026-07-15T01:00:00.000Z",
    });
    insight.track({
      provider: "gemini",
      model: "gemini-2.0-flash",
      promptTokens: 10,
      completionTokens: 5,
      timestamp: "2026-07-16T01:00:00.000Z",
    });

    const daily = insight.dailyReport();
    expect(daily.map((d) => d.period)).toEqual(["2026-07-15", "2026-07-16"]);
    expect(insight.dailyReport("2026-07-15")[0]?.stats.calls).toBe(1);

    const monthly = insight.monthlyReport("2026-07");
    expect(monthly).toHaveLength(1);
    expect(monthly[0]?.stats.calls).toBe(2);
  });

  it("exports CSV and JSON", () => {
    const insight = new AICostInsight();
    insight.track({
      provider: "openai",
      model: "gpt-4o-mini",
      promptTokens: 1,
      completionTokens: 1,
      latencyMs: 10,
    });

    const csv = insight.toCSV();
    expect(csv.split("\n")[0]).toContain("promptTokens");
    expect(csv.split("\n")).toHaveLength(2);

    const json = JSON.parse(insight.toJSON());
    expect(json.summary.calls).toBe(1);
    expect(json.events).toHaveLength(1);
    expect(toCSV(insight.getEvents())).toBe(csv);
  });

  it("supports import and custom pricing", () => {
    const insight = new AICostInsight({
      pricing: {
        openai: { "custom-model": { input: 1, output: 2 }, default: { input: 1, output: 2 } },
      },
    });

    const cost = calculateCost("openai", "custom-model", 1_000_000, 1_000_000, {
      openai: { "custom-model": { input: 1, output: 2 }, default: { input: 1, output: 2 } },
    });
    expect(cost).toBe(3);

    insight.track({
      provider: "openai",
      model: "custom-model",
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    expect(insight.summary().costUsd).toBe(3);

    const clone = new AICostInsight();
    clone.importEvents(insight.getEvents());
    expect(clone.summary().calls).toBe(1);
  });

  it("validates track() input", () => {
    const insight = new AICostInsight();
    expect(() =>
      insight.track({
        provider: "openai",
        model: "gpt-4o-mini",
        promptTokens: -1,
        completionTokens: 0,
      }),
    ).toThrow(/token counts/);
    expect(() =>
      insight.track({
        provider: "openai",
        model: "gpt-4o-mini",
        promptTokens: Number.NaN,
        completionTokens: 0,
      }),
    ).toThrow(/finite/);
    expect(() =>
      insight.track({
        provider: "openai",
        model: "gpt-4o-mini",
        promptTokens: 1,
        completionTokens: 1,
        timestamp: "not-a-date",
      }),
    ).toThrow(/timestamp/);
  });
});
