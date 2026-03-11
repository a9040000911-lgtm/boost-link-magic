# Project Development Guide (Skills & Methodologies)

This project follows a high-standard AI-native development workflow. These "skills" are integrated into our environment.

## 1. Ralph Loop Methodology (Iterative Development)
We use the **Ralph Loop v3** for all coding tasks:
- **Step 1: Receive/Analyze**: Holistic audit against project architecture.
- **Step 2: Decompose**: Break goals into User Stories in `task.md`.
- **Step 3: Solve**: Sequential implementation with atomic commits.
- **Step 4: Verify**: Mandatory `npm run build` and `npm run test`.
- **Step 5: Persist**: Document results in `walkthrough.md`.

## 2. Spec-Driven Development (SDD)
Before implementing complex logic (like the Referral System), we create an `implementation_plan.md`. This ensures alignment on:
- Database schema changes.
- UI/UX flow.
- Security implications (RLS).

## 3. Modern Web Stack (CoolLike 2026)
- **Next.js 16 + React 19**: Leveraging the latest hydration and streaming features.
- **Tailwind CSS 4**: Utilizing the new engine for faster builds and simplified config (`@theme`).
- **Supabase Integrity**: Atomic operations and row-level security are non-negotiable.

## 4. How to use these "Skills"
If you are an AI agent working on this repo:
1. **Read `.cursorrules`** at the start of every session.
2. **Follow `task.md`** for the current state of work.
3. **Don't skip verification**. A failed build means the loop is not finished.
