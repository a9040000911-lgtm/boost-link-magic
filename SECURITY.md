# Security Protocols (CoolLike)

The CoolLike project implements a "Shift-Left" security strategy, integrating safety from the first line of code.

## 1. Web Security (OWASP Top 10: 2026)
- **A01: Broken Access Control**: Enforced via Supabase **Row Level Security (RLS)**. No table is accessible without a policy.
- **A03: Software Supply Chain**: All dependencies must be version-locked (package-lock.json). Periodic `npm audit` is mandatory.
- **A05: Injection**: Use parameterized queries (handled by Supabase Client). Never concatenate user input into SQL.
- **A07: Authentication**: Use Supabase Auth with MFA (Multi-Factor Authentication) enabled for administrative roles.

## 2. AI & LLM Security (OWASP for LLM)
- **Prompt Injection Defense**: 
  - Sanitize all user-provided context before passing to LLM.
  - Use system prompts to strictly define operational boundaries.
- **Excessive Agency**: Never grant LLM direct access to destructive tools without a "Human-in-the-Loop" (HITL) step.
- **Sensitive Data Exposure**: Scrub PII (Personally Identifiable Information) from logs and AI context.

## 3. DevSecOps Workflow
- **Continuous Scanning**: Linting and type-checking run on every pre-commit and CI cycle.
- **Secret Management**: **NEVER** commit .env or API keys. Use GitHub Secrets / Supabase Vault.
- **Fail-Open Prevention**: Error handlers must default to "Access Denied" or safe fallbacks.

## 4. Incident Response
- In case of a breach, immediately rotate all `SERVICE_ROLE` and `API_KEY` credentials via the Supabase Dashboard.
- All logs are immutable and stored for audit trails.
