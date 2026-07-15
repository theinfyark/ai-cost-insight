# ai-cost-insight

Universal **AI cost and token usage tracker** for TypeScript / Node.js.

```bash
npm install ai-cost-insight
```

## Features

- Cost calculation
- Token tracking
- Latency
- Model comparison
- Provider comparison
- Daily reports
- Monthly reports
- Usage aggregation
- CSV export
- JSON export

## Quick start

```ts
import { AICostInsight } from "ai-cost-insight";

const insight = new AICostInsight();

insight.track({
  provider: "openai",
  model: "gpt-4o-mini",
  promptTokens: 1200,
  completionTokens: 800,
  latencyMs: 420,
});

insight.track({
  provider: "anthropic",
  model: "claude-3-5-haiku-latest",
  promptTokens: 900,
  completionTokens: 600,
  latencyMs: 380,
});

console.log(insight.summary());
console.log(insight.compareProviders());
console.log(insight.compareModels());
console.log(insight.dailyReport());
console.log(insight.monthlyReport());
```

## Pair with any SDK

```ts
const started = Date.now();
const completion = await openai.chat.completions.create({ /* ... */ });

insight.track({
  provider: "openai",
  model: completion.model,
  promptTokens: completion.usage?.prompt_tokens ?? 0,
  completionTokens: completion.usage?.completion_tokens ?? 0,
  latencyMs: Date.now() - started,
});
```

Works the same with Anthropic, Gemini, Groq, and other providers — normalize tokens then `track()`.

## Reports

```ts
insight.dailyReport();           // all days
insight.dailyReport("2026-07-15");

insight.monthlyReport();         // all months
insight.monthlyReport("2026-07");
```

Each report includes totals plus `byProvider` / `byModel` breakdowns.

## Comparison

```ts
insight.compareProviders();
// [{ key, calls, totalTokens, costUsd, avgLatencyMs, costPer1kTokens }]

insight.compareModels();
```

## Export

```ts
const csv = insight.toCSV();
const json = insight.toJSON();

await fs.writeFile("usage.csv", csv);
await fs.writeFile("usage.json", json);
```

## Custom pricing

```ts
const insight = new AICostInsight({
  pricing: {
    openai: {
      "my-finetune": { input: 1.2, output: 3.4 },
      default: { input: 0.5, output: 1.5 },
    },
  },
  onTrack: (event) => console.log(event.costUsd),
});
```

Pricing values are **USD per 1M tokens**. Built-in tables cover OpenAI, Azure OpenAI, Anthropic, Gemini, Groq, DeepSeek, Mistral, OpenRouter, and Ollama (estimates).

## API

| Method | Purpose |
|--------|---------|
| `track(input)` | Record a call |
| `summary()` | Aggregate stats |
| `compareProviders()` | Provider comparison |
| `compareModels()` | Model comparison |
| `dailyReport()` | Daily breakdown |
| `monthlyReport()` | Monthly breakdown |
| `toCSV()` / `toJSON()` | Export |
| `importEvents()` | Rehydrate |
| `clear()` | Reset |

Also exported: `calculateCost`, `DEFAULT_PRICING`, `toCSV`, `toJSON`.

## Versioning

Semantic Versioning. See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
