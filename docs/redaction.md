# Redaction

Redaction protects common sensitive values before output is returned and before audit entries are written.

```ts
gate(
  {
    name: "get_config",
    redact: true
  },
  async () => ({
    token: "ghp_abcdefghijklmnopqrstuvwxyz",
    public: "visible"
  })
);
```

Default sensitive keys include:

- `token`
- `apiKey`
- `apikey`
- `secret`
- `password`
- `authorization`
- `auth`
- `clientSecret`
- `connectionString`

Default patterns include bearer tokens, GitHub tokens, OpenAI-style keys, JWT-like strings, and simple key-value secret forms.

Redaction is best-effort. It reduces accidental exposure but cannot prove that every sensitive value has been found.
