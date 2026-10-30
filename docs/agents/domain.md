# Domain Docs

This repo uses a single-context layout.

## Before exploring, read these

- `GLOSSARY.md` at the repo root.
- ADRs under `docs/adr/` that touch the area you are about to work in.

If these files do not exist, proceed silently. Do not flag their absence or suggest creating them upfront. The `/domain-modeling` skill, reached via `/grill-with-docs` and `/improve-codebase-architecture`, creates them lazily when terms or decisions get resolved.

## File structure

- `GLOSSARY.md`: shared domain vocabulary.
- `docs/adr/`: architecture decision records.

## Use the glossary's vocabulary

When your output names a domain concept—in an issue title, refactor proposal, hypothesis, or test name—use the term defined in `GLOSSARY.md`, including its guidance on avoided synonyms.

If a needed concept is absent, reconsider whether the project uses it; note genuine gaps for `/domain-modeling`.

## Flag ADR conflicts

If a proposal contradicts an existing ADR, identify that ADR and explain why reopening the decision is justified rather than silently overriding it.
