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

## Introduction

**ai-cost-insight** helps you ship reliable Node.js / TypeScript applications with a small, focused API.

## Why this package exists

Popular stacks need small, trustworthy utilities with excellent DX. **ai-cost-insight** exists to solve one problem well: clear APIs, strong typing, minimal dependencies, and production-ready defaults — without the overhead of larger frameworks.

## Installation

```bash
npm install ai-cost-insight
# or
pnpm add ai-cost-insight
yarn add ai-cost-insight
```

Requires Node.js 18+.

## API Reference

See the exports from `ai-cost-insight` and the inline TypeScript types for the full surface area. Primary entry points are documented in **Quick Start** and **Examples** above.

## Examples

Minimal usage is shown in **Quick Start**. Prefer copying those snippets first, then expand into your app’s error handling and configuration patterns.

## Advanced Examples

- Combine with environment validation, logging, and health checks in production services
- Prefer dependency injection / custom `fetch` / client injection in tests
- Keep configuration explicit; avoid hidden global state

## Framework Integration

Works with Express, Fastify, Hono, NestJS, and plain Node HTTP servers. Import ESM (or CJS where published) and call the documented APIs from route handlers, middleware, or background jobs.

## TypeScript Usage

```ts
import { /* symbols */ } from "ai-cost-insight";
```

Types ship with the package (`types` / `exports.types`). Enable `strict` in your `tsconfig` for the best DX.

## Error Handling

- Fail fast with typed / named errors where provided
- Never swallow errors silently in production paths
- Prefer returning structured error payloads in HTTP layers
- Surface actionable messages (what failed + how to fix)

## Performance

- Minimal runtime work on the hot path
- Avoid unnecessary allocations and dependencies
- Tree-shakeable ESM entry points
- Prefer streaming / lazy work when dealing with large payloads

## Best Practices

- Pin major versions with SemVer ranges you trust
- Validate configuration at process startup
- Add health checks and observability around I/O
- Write tests for failure modes (timeouts, bad input, missing credentials)

## FAQ

**Does it work with ESM and CommonJS?**  
Yes where the package publishes dual exports. Prefer ESM for new projects.

**Is it production-ready?**  
Yes — tests, types, and SemVer releases are part of the maintenance model.

**How do I report a bug?**  
Open a GitHub issue using the bug template.

## Migration Guide

### From 0.x / early drafts
This package follows SemVer. Breaking changes land in major releases and are called out in `CHANGELOG.md`.

### Upgrading patch/minor
Patch and minor releases are backward compatible. Run your test suite after upgrading.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ERR_MODULE_NOT_FOUND` | Wrong Node version / bad import path | Use Node 18+ and package `exports` |
| Types not resolving | Old moduleResolution | Use `bundler` or `node16`+ |
| Auth / network failures | Missing env or blocked egress | Check credentials and firewall |
| Unexpected runtime errors | Invalid input | Validate options; read error message |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs with tests and docs are welcome.

