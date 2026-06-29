# Release Process

Publishing is automated through GitHub Releases, not regular commits.

## One-Time Setup

Use one of these npm authentication options.

Recommended: configure npm Trusted Publishing for this package:

```text
Package: toolgate-mcp
Repository: Wezylnia/mcp-guard
Workflow: publish.yml
```

Alternative: add an npm automation token as a repository secret:

```text
NPM_TOKEN
```

The token must be allowed to publish `toolgate-mcp`. A normal login token that requires OTP for publish is not enough for unattended GitHub Actions publishing.

The workflow supports both modes. If `NPM_TOKEN` exists, it uses the token. If not, it attempts Trusted Publishing through GitHub OIDC.

## Release Steps

1. Update `packages/mcp/package.json` version.
2. Run local verification:

```bash
npm run typecheck
npm test
npm run build
npm audit
npm publish --dry-run -w toolgate-mcp
```

3. Commit and push the version bump.
4. Create a GitHub Release with a tag matching the package version:

```text
v0.2.1
```

5. When the release is published, `.github/workflows/publish.yml` runs tests and publishes to npm.

The workflow refuses to publish when the release tag does not match `packages/mcp/package.json`.
