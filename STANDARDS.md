# Engineering Standards (CoolLike)

This project adopts software engineering principles used by leading technology companies (Google, Meta, Netflix) to ensure longevity, scalability, and impact.

## 1. Code Excellence
- **Atomic Commits**: Each commit represents one logical, verified change.
- **Mandatory Reviews**: Every non-trivial change MUST be reviewed. For AI agents, this means self-audit or cross-model verification.
- **Strict Typing**: TypeScript is not optional. Avoid `any`. Prefer interfaces for data contracts.
- **DRY & KISS**: Don't Repeat Yourself, but keep it Simple, Stupid. Avoid over-engineering unless scale requires it.

## 2. Reliability (SRE Principles)
- **SLO (Service Level Objectives)**: We aim for 99.9% uptime for core API routes.
- **Error Budgets**: Reliability is a feature. If the budget is exceeded, development stops until the system is stable.
- **Blameless Postmortems**: Failures are data points. We analyze *why* the process failed, not *who* failed.
- **The RED Method**: Monitor **R**ate (requests/sec), **E**rrors (fail/sec), and **D**uration (latency).

## 3. High-Impact Culture (Meta Style)
- **Move Fast (with Stability)**: Ship iteratively. Small, safe releases are better than large, risky ones.
- **Data-Driven**: Every feature should have a measurable impact. Use analytics to justify UX changes.
- **Engineering Excellence Axis**: Performance is measured by project impact, technical quality, and collaboration.

## 4. Maintenance & Longevity
- **Standardization**: Use consistent patterns across the codebase (e.g., standard Tailwind 4 themes).
- **Technical Debt Management**: Dedicate 20% of effort to refactoring and improving developer experience (DX).
- **Automation**: If you do it twice, automate it (CI/CD, scripts, triggers).
