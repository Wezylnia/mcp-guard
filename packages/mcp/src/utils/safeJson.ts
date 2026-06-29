export function safeJsonClone<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function summarizeOutput(output: unknown): Record<string, unknown> {
  if (typeof output === "string") {
    return { type: "text", size: output.length };
  }

  if (output === null) {
    return { type: "null", size: 0 };
  }

  if (Buffer.isBuffer(output)) {
    return { type: "buffer", size: output.byteLength };
  }

  const serialized = JSON.stringify(output);
  return {
    type: Array.isArray(output) ? "array" : typeof output,
    size: serialized?.length ?? 0
  };
}
