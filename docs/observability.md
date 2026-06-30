# Observability

Attach an `observe` callback to receive lifecycle events without coupling ToolGateKit to a
telemetry SDK.

```ts
const tool = gate(
  {
    name: "fetch_url",
    observe: async (event) => {
      span.addEvent(`toolgate.${event.type}`, {
        requestId: event.requestId,
        tool: event.toolName,
        risk: event.risk,
        durationMs: event.durationMs,
        ...("code" in event ? { code: event.code } : {})
      });
    }
  },
  handler
);
```

Events are `started`, `approved`, `blocked`, `completed`, and `failed`. They contain identifiers,
timing, decision codes, and output summaries but never raw tool input or output. This avoids
copying secrets into telemetry by default.

Observer errors are ignored and cannot change the tool result. Observer calls are awaited, so a
slow observer adds latency; exporters should enqueue work and return promptly.

## OpenTelemetry Spans

`createOpenTelemetryObserver()` accepts the structural `Tracer`/`Span` methods exposed by the
OpenTelemetry JavaScript API without adding it as a package dependency:

```ts
const observe = createOpenTelemetryObserver({
  tracer: trace.getTracer("filesystem-mcp"),
  attributes: { "service.name": "filesystem-mcp" }
});

const toolgate = createToolGate({ defaults: { observe } });
```

One span is created per call. Completed calls use OK status; blocked and failed calls use ERROR
status with the ToolGate decision code. Raw inputs and outputs are never added to spans.
