# MANIFEST: what is in this kit, what stays outside, what it runs on

## Kit contents

```
lesson-factory/
├── START.md                the entry point, always read first
├── PIPELINE.md             stages and gates
├── QUALITY-BAR.md          the measurable contract
├── SKILLS-POLICY.md        what may be loaded, what may never be, how it is enforced
├── SPEC-TEMPLATE.md        per-lesson spec with word budgets and the prose
├── NOTES-TEMPLATE.md       companion notes, including the required skills declaration
├── PROMPTS.md              paste-in prompts for any LLM
├── MANIFEST.md             this file
├── kit-origins.json        where each copied file came from, for the self-check
├── HOW-THIS-WORKS.html     the plain-language explainer of the whole system
├── tools/
│   └── quality-gate.py     the gate script and the kit self-check
├── gold/                   the reference lesson, its teardown, its measured numbers
├── chassis/                the clone stencil, the frozen engine contract, the poke menu
├── identity/               Electric Ink lock, color families, shared tokens
├── voice/                  style guide, cert book, voice skill, before and after examples
├── content/                objective registry, objectives guide, DC centerpiece router
├── pedagogy/               cognitive goals, research foundations, frameworks, craft, vocabulary
│                           plus README.md mapping the beat spine to Merrill and the effects
├── assessment/
│   └── ASSESSMENT.md       how to write checkpoint items, and the integrity rules
└── ship/
    └── SHIP.md             package and delivery rules
```

The copies in chassis, identity, voice, content and pedagogy are the canonical working set for this job. The originals remain where they were as history. Edit the kit copy; `--selfcheck` reports when a kit copy and its original have drifted apart, using `kit-origins.json`.

## Canonical files that stay OUTSIDE the kit

| File | Where | Why it stays out |
|---|---|---|
| PRACTICE-QUESTION-BANK.md | Training Projects/DC Fundamentals AI Rebuild/ | Live item bank Nick maintains; one copy only |
| CAET-LESSON-SEQUENCE.md | Training Projects/DC Fundamentals AI Rebuild/ | Student C-number order, maintained there |
| CAET textbook and signed chapters | repo 00ainick-cmd/caet-textbook, and NN-slug-chapter.md files | Authored per lesson, upstream of this kit |
| CAET Daily Lesson Plans.html | CAET 9 Week Program/ | The 45 day plans, signed and locked |
| AERO-Player | E-Learning Development/AERO-Player/ | The delivery vehicle; `npm run build-course` lives there |
| notify-audit.ps1 | ace-atlas-course-player/scripts/ | Nick's audit alarm, Windows only |
| check-exam-overlap.py | Training Projects/DC Fundamentals AI Rebuild/ | Integrity gate against the live exam |
| The certification workbook and Question-to-LO map | private | Never opened, for any reason |

## What it runs on

**Any LLM can use this kit.** Everything except one file is plain Markdown, and the exception is a single Python script.

| Capability the session has | What it can do |
|---|---|
| Read files | Read the kit, follow the pipeline, write the spec and prose. This is the whole planning half of the job. |
| Read and write files | Build the lesson. This is the full job. |
| Read, write, and run Python 3 | The above, plus automated measurement with `quality-gate.py`. Nick's machine has Python 3.10. |
| No file access at all (chat only) | Paste START.md, QUALITY-BAR.md, the voice files and the chassis into the conversation, and score the result by hand against the table in QUALITY-BAR.md. It works, it is just slower and burns context. |

The script uses only the Python standard library. No installs, no internet, no packages. It runs on Windows, macOS and Linux, and on Python 3.8 or newer.

If a session cannot run Python, it scores the QUALITY-BAR table by hand and shows the filled table in its report. Every axis in that table is countable in a text editor. What is lost is speed and consistency, not the standard.

Practical notes by tool: a session with a small context window should follow the staged reading table in START.md strictly rather than loading the kit at once. A session that cannot see the folder needs the files pasted, and PROMPTS.md still applies.

## Moving the kit

1. Copy the whole lesson-factory folder. Everything inside links by relative path.
2. Bring the practice bank and lesson sequence, or grant access where they live. Bring AERO-Player if you will ship.
3. Point the session at START.md. That is the entire onboarding.
4. Run `python3 tools/quality-gate.py --selfcheck` to confirm the copy arrived intact.

## Keeping it honest

- One edit point: rules change in this kit, nowhere else.
- The gate script and QUALITY-BAR.md state the same numbers; change both together, and only Nick changes them.
- Run `--selfcheck` after any month where files moved, and any time a build feels like it drifted.
- If a session finds a real conflict between kit docs, it reports the two lines to Nick and stops guessing.
