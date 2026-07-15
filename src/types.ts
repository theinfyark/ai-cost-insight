export type ProviderName =
  | "openai"
  | "azure-openai"
  | "anthropic"
  | "gemini"
  | "groq"
  | "deepseek"
  | "mistral"
  | "openrouter"
  | "ollama"
  | (string & {});

export interface PriceRate {
  /** USD per 1M input tokens */
  input: number;
  /** USD per 1M output tokens */
  output: number;
}

export interface UsageEventInput {
  provider: ProviderName;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs?: number;
  timestamp?: string | Date;
  requestId?: string;
  meta?: Record<string, unknown>;
  /** Override computed cost (USD) */
  costUsd?: number;
}

export interface UsageEvent {
  id: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  costUsd: number;
  timestamp: string;
  requestId?: string;
  meta: Record<string, unknown>;
}

export interface AggregateStats {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
}

export interface GroupedStats extends AggregateStats {
  key: string;
}

export interface PeriodReport {
  period: string;
  stats: AggregateStats;
  byProvider: GroupedStats[];
  byModel: GroupedStats[];
  events: UsageEvent[];
}

export interface ComparisonRow {
  key: string;
  calls: number;
  totalTokens: number;
  costUsd: number;
  avgLatencyMs: number;
  costPer1kTokens: number;
}
