import type { ToolPolicy } from "../gate/types.js";
import { evaluateNetworkPolicy } from "./networkPolicy.js";
import { evaluatePathPolicy } from "./pathPolicy.js";

export interface PolicyDecision {
  allowed: boolean;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export function evaluatePolicy(policy: ToolPolicy, input: unknown): PolicyDecision {
  const decisions = [
    evaluatePathPolicy(policy, input),
    evaluateNetworkPolicy(policy, input)
  ];

  return decisions.find((decision) => !decision.allowed) ?? { allowed: true };
}
