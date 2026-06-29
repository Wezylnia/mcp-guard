import type { ToolPolicy } from "../gate/types.js";
import { evaluatePathPolicy } from "./pathPolicy.js";

export interface PolicyDecision {
  allowed: boolean;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export function evaluatePolicy(policy: ToolPolicy, input: unknown): PolicyDecision {
  return evaluatePathPolicy(policy, input);
}
