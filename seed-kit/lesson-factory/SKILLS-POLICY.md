# Skills policy: what may be loaded, and what may never be

This is the answer to "how do I know it will not drag in an old skill." Everything before this file was a promise. This file is a named list, and the gate script checks it.

## The problem, stated honestly

The workspace currently holds **15 skill definitions on disk**, two stray copies of a skill sitting loose in the reference folder, roughly ten more named in the old routers that live outside the bundle, and **13 OneDrive conflict duplicates** in the foundation and reference folders alone (files ending `-NickDesktop_01`). Any of them can be pulled into a session by a helpful model that went looking. Several of them build a completely different product and will quietly reshape the lesson if loaded.

Vague instructions do not stop this. "Do not use old skills" gives a model nothing to match on. Names do.

## USE: the only sources for this job

These are inside the kit. Nothing else is required to build a lesson.

| Load | For |
|---|---|
| `START.md`, `PIPELINE.md`, `QUALITY-BAR.md` | The job, the order, the bar |
| `SPEC-TEMPLATE.md` | The plan |
| `pedagogy/` | Why the lesson is shaped this way. Spec stage only. |
| `voice/` | Every sentence on the page |
| `chassis/` | The frame, the gates, the poke menu |
| `identity/` | The look and the color law |
| `content/` | Objective wording and the DC centerpiece table |
| `assessment/` | The checkpoint |
| `gold/GOLD-TEARDOWN.md` | The craft bar |

The kit is self-sufficient by design. If you feel the need to go outside it, that is a signal the kit is missing something. Say so to Nick rather than reaching for an old skill.

## ASK: allowed only when the signed spec names it

Each of these builds one specific centerpiece. It is loaded only if the spec's centerpiece line calls for that thing, and the notes file records why.

| Skill | Only when the centerpiece is |
|---|---|
| `caet-player-editor` | Authoring the signed textbook chapter, which happens **before** this kit runs |
| `circuit-simulator-builder` | A live schematic that computes Ohm's Law in real time |
| `oscilloscope-viewer-builder` | A waveform the student must read |
| `hyperframes` and `aero-slide-video-builder` | Motion that is itself the teaching, rendered to video |
| `aero-course-inspector` | Running the rendered QA pass at G2 |
| `aero-course-player-builder`, `aero-export-packager` | Packaging at S3, after G3 |

## NEVER: do not load for an Electric Ink lesson

Each row says why, because a reason travels better than a prohibition.

| Never load | Why |
|---|---|
| `training-architect` | Its DESIGN mode is replaced by this kit's spec stage. Running both produces two competing plans. |
| `project-intake`, `reference-builder` | Same. `SPEC-TEMPLATE.md` is the intake now. |
| `narrative-training-module-builder` | Builds branching judgment modules. A different product with a different spine (cold open, crucible, pivot). |
| `reference/narrative-training-module-builder-SKILL*.md` | Two loose copies of that same skill sitting in the reference folder. Not a reference document. |
| `reference/merrill-mapping*.md` | Maps Merrill to the narrative format, not this one. The correct mapping for this format is in `pedagogy/README.md`. |
| `cardcraft-builder` (`CardCraft-Library/SKILL.md`) | Builds ACE Course Player acts. Wrong delivery vehicle. Steal card jobs from the teardown instead. |
| `visual-learning-builder` (both copies) | Builds standalone visual cards. Not a lesson builder. |
| `device-trainer-builder` | Different product. |
| `aero-course-stylist` | Restyles player courses. Electric Ink is locked; a restyle pass is how the look drifts. |
| `storybrand-framework`, `copywriting-formulas` | Marketing voice. The lesson voice is Nick's cert book. |
| `ACE-html-training-factory-audit` (Genesis) | Superseded. Mixes the PEOPLE and ACE player tracks into this one. |
| Any file matching `*-NickDesktop_*` | OneDrive sync conflict copies. Stale twins of real files, and a session cannot tell which is current. |
| The Genesis mirror folder | Backup only. Never a source. |
| `hangar.html`, apprenticeship `lesson-shell.html` | Rejected, and a different identity. |
| The certification workbook / Question-to-LO map | The live exam. Never opened, for any reason. |

## How this is enforced

Three mechanisms, not one.

**1. The notes file must declare what was loaded.** Every lesson's companion `-notes.md` carries a section headed `## Skills and files loaded`, listing every skill and every outside file the session opened. The gate script reads it.

**2. The gate fails on a blocklisted name.** If any NEVER name appears in the declaration, or anywhere in the lesson HTML, the lesson fails. A missing declaration section also fails. This turns the honor system into a checked artifact: a session that loaded an old skill either declares it and fails, or hides it and is lying in a file Nick reads.

**3. The kit self-check sweeps for contamination.** Run:

```
python3 tools/quality-gate.py --selfcheck
```

It reports conflict twins inside the kit, blocklisted files that have appeared in it, and whether the kit's copies still match the originals they were taken from. Run it whenever something feels off, and after any month where files moved.

## The honest limit

None of this can stop a model from reading a file it was handed directly by a person. If a session is given an old skill in its opening prompt, it will use it. The policy protects against a model wandering off and finding one, which is the failure mode you actually hit. The other one is on the prompt, and `PROMPTS.md` is written to avoid it.

## When a skill should be added here

If a lesson genuinely needs a capability the kit lacks, do not quietly load an old skill. Tell Nick what is missing. Either the kit absorbs it, or it earns a row in the ASK table with a named condition. The list stays short on purpose: every name in ASK is a door, and doors are how this drifted the first time.
