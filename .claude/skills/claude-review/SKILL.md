---
name: claude-review
description: Review CLAUDE.md and all skills under .claude/skills/ for accuracy, clarity, and consistency with the codebase.
---

# Claude Review Workflow

Review `CLAUDE.md` and all skills under `.claude/skills/` to ensure they accurately reflect the codebase and follow the writing principles below.

## Steps

1. Read `CLAUDE.md` and all files in `.claude/skills/`.
2. Verify the project structure section in `CLAUDE.md` against the actual filesystem using `ls` and `find`.
3. For each file, compile proposed changes that address any of the following:
   - Information that no longer matches the codebase or conventions.
   - Information repeated across more than one file.
   - Instructions phrased as prohibitions rather than positive directives.
   - Detail that belongs in source code rather than documentation.
   - Content in `CLAUDE.md` outside of architecture, project structure, or skill descriptions.
4. Present the full list of proposed changes — file, section, and specific edit — and wait for approval.
5. Apply only approved changes.
6. Run the `/pr` skill to commit and submit the updates.

## Writing principles

- **CLAUDE.md scope:** general architecture, project structure with responsibility notes, and skill descriptions with their ordering relationships. Everything else belongs in the relevant skill file or in source code.
- **Skill file scope:** mechanics of that one skill only. Cross-skill ordering belongs in `CLAUDE.md`.
- **Positive directives:** state what to do. Rephrase prohibitions as the correct action to take instead.
- **Say each thing once:** if something already appears in one file, link to it rather than repeating it.
- **Concise sentences:** remove phrases that add length without adding meaning.
