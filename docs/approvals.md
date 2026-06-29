# Approvals

`requireApproval: true` blocks a tool unless the host supplies an approval provider and the
provider explicitly approves that call. ToolGateKit does not render an approval interface.

```ts
import { gate } from "toolgate-mcp";

const deleteFile = gate(
  {
    name: "delete_file",
    risk: "destructive",
    requireApproval: true,
    approval: async ({ input, requestId, toolName }) => {
      const decision = await approvalService.request({ input, requestId, toolName });
      return {
        approved: decision.approved,
        reason: decision.reason,
        metadata: { approverId: decision.approverId }
      };
    }
  },
  async ({ path }) => {
    await fs.rm(path);
    return { deleted: path };
  }
);
```

The provider can return a boolean or an `ApprovalDecision`. Only `true` or
`{ approved: true }` permits execution.

- No provider returns `APPROVAL_REQUIRED`.
- A rejected decision returns `APPROVAL_DENIED` and does not call the handler.
- A provider failure returns `APPROVAL_ERROR` and does not call the handler.
- Approval metadata is merged into the final audit entry.

The host must authenticate the approver, bind the decision to the displayed input, and prevent
approval replay. ToolGateKit only invokes the provider and enforces its decision.
