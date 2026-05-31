# Agents Review Workflow

Review AGENTS.md and all files under `workflows/` to ensure they accurately reflect the codebase and follow the writing principles below.

## Steps

1. Read AGENTS.md and all files in `workflows/`.
2. Verify the project structure section in AGENTS.md against the actual filesystem using `ls` and `find`.
3. For each file, compile proposed changes that address any of the following:
   - Information that no longer matches the codebase or conventions.
   - Information repeated across more than one file.
   - Instructions phrased as prohibitions rather than positive directives.
   - Detail that belongs in source code rather than documentation.
   - Content in AGENTS.md outside of architecture, project structure, or workflow descriptions.
4. Present the full list of proposed changes — file, section, and specific edit — and wait for approval.
5. Apply only approved changes.
6. Run the **pr** workflow to commit and submit the updates.

## Writing principles

- **AGENTS.md scope:** general architecture, project structure with responsibility notes, and workflow descriptions with their ordering relationships. Everything else belongs in the relevant workflow file or in source code.
- **Workflow file scope:** mechanics of that one workflow only. Cross-workflow ordering belongs in AGENTS.md.
- **Positive directives:** state what to do. Rephrase prohibitions as the correct action to take instead.
- **Say each thing once:** if something already appears in one file, link to it rather than repeating it.
- **Concise sentences:** remove phrases that add length without adding meaning.
