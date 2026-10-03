export interface AiModelInfo {
  id: string;
  name: string;
  desc: string;
  inPerM: number;
  outPerM: number;
  recommended?: boolean;
}

export const MARKING_MODELS: AiModelInfo[] = [
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 mini",
    desc: "Recommended for careful answer marking and genuine paraphrases",
    inPerM: 0.4,
    outPerM: 1.6,
    recommended: true,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    desc: "Higher-capability marking for complex responses",
    inPerM: 2,
    outPerM: 8,
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 nano",
    desc: "Lowest-cost option; may be less reliable on nuanced answers",
    inPerM: 0.1,
    outPerM: 0.4,
  },
  {
    id: "gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    desc: "Three AI markers vote on every answer (uses about 3× tokens per check)",
    inPerM: 0.2,
    outPerM: 1.2,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    desc: "Low-cost marking; may miss unusual paraphrases",
    inPerM: 0.15,
    outPerM: 0.6,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    desc: "Larger, more expensive model for comparison testing",
    inPerM: 2.5,
    outPerM: 10,
  },
];

export const CONTENT_MODELS: AiModelInfo[] = [
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 mini",
    desc: "Recommended balance of quality, speed and cost",
    inPerM: 0.4,
    outPerM: 1.6,
    recommended: true,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    desc: "Higher-capability model for detailed content generation",
    inPerM: 2,
    outPerM: 8,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    desc: "Lower-cost content generation",
    inPerM: 0.15,
    outPerM: 0.6,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    desc: "Higher-cost model for complex content tasks",
    inPerM: 2.5,
    outPerM: 10,
  },
];

export const PRESENTATION_MODELS: AiModelInfo[] = [
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 mini",
    desc: "Recommended for grounded, well-structured slide decks",
    inPerM: 0.4,
    outPerM: 1.6,
    recommended: true,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    desc: "Higher-capability model for detailed presentations",
    inPerM: 2,
    outPerM: 8,
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 nano",
    desc: "Fast, lowest-cost presentation generation",
    inPerM: 0.1,
    outPerM: 0.4,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    desc: "Lower-cost presentation generation",
    inPerM: 0.15,
    outPerM: 0.6,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    desc: "Higher-cost model for complex presentations",
    inPerM: 2.5,
    outPerM: 10,
  },
];

export function selectAiModel(
  value: unknown,
  models: readonly AiModelInfo[],
  defaultModel: string
): string | null {
  if (value === undefined)
    return models.some((model) => model.id === defaultModel) ? defaultModel : null;
  if (typeof value !== "string") return null;
  return models.some((model) => model.id === value) ? value : null;
}
