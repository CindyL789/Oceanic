# COPILOT TASK — Collaboration Setup for Cindy

> **For:** GitHub Copilot in Oceanic (CindyL789's Copilot)
> **From:** Captain (@NyxSpecter4) via Ziggy assistant
> **Date:** 2026-07-13
> **Priority:** Read this before starting any work

## Hey Cindy

Captain here. We've been working on the marine/animal GPS tracker project across multiple repos and it's causing confusion. Here's what I'm proposing.

## The problem

We have repo sprawl. Between us we have: oceanpulse, oceanpulse-unified, and Oceanic. AI tools (Copilot, Kimiclaw) keep creating new repos instead of working in existing ones. This makes collaboration harder, not easier.

## The decision

**oceanpulse (NyxSpecter4/oceanpulse) is the canonical repo** for the marine GPS tracker project. You're already a collaborator on it with push access.

I'm not saying Oceanic is bad work. I'm saying let's consolidate into one repo so we're not duplicating effort across three.

## What I set up on oceanpulse

PR #3: https://github.com/NyxSpecter4/oceanpulse/pull/3

- Anti-sprawl rules for AI agents (no new repos, no direct push to main)
- CODEOWNERS (auto-assigns reviewers — you and me)
- PR template (structured format for every pull request)
- Issue templates (bug reports + feature requests)
- CONTRIBUTING.md (full collaboration guide)
- Branch protection on main (1 approval required, no force push)

## What I'm asking

1. **Review PR #3 on oceanpulse** — approve or request changes
2. **Move any work from Oceanic into oceanpulse** — if there's code here that isn't in oceanpulse, let's get it in there via a PR
3. **Archive Oceanic** once everything is moved over (or keep it as a personal scratch space, but the real project lives in oceanpulse)
4. **Tell your Copilot to read `.github/copilot-instructions.md`** on oceanpulse at the start of every session

## Rules for your Copilot (on this repo too)

If you keep working in Oceanic for now, follow the same discipline:

1. **NEVER create a new GitHub repository.** Work in existing repos only.
2. **NEVER push directly to main.** Use branches and PRs.
3. **NEVER create a branch without a task.** Use `feature/<description>` or `fix/<description>`.
4. **NEVER force push.**
5. **Always pull from main before starting work.**

## The collaboration model

You keep your infrastructure (repos, agents, DB, tools). I keep mine (Supabase, Vercel, my agents). We don't need to share infrastructure. We share the **codebase** and a **review process**.

One repo per project. Both developers as collaborators. Branch and PR. Review each other's work. Ship.

That's it. That's how professional teams do it. That's how we're going to do it.

## Contact

- Open an issue on oceanpulse: https://github.com/NyxSpecter4/oceanpulse/issues
- Or message me directly

Let's build something good together.
