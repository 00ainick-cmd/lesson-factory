# PIPELINE: one lesson, four gates

Every lesson moves through these stages in order. A gate is closed by the named signer, never by the builder deciding it feels done. Nick signs G0 and G3. The script closes G1 and G2.

```
 S0 SPEC ──[G0: Nick signs]── S1 SKELETON ──[G1: gate script, skeleton mode]──
 S2 BUILD ──[G2: gate script fully green + self-review]── Nick's audit ──
 [G3: Nick signs]── S3 SHIP
```

## S0: Spec (no HTML exists yet)

First read `pedagogy/README.md` and name the cognitive goal this lesson serves. Then read `chassis/BEAT-TYPES.md` and choose a type for every beat before you think about layout or widgets. Type first, then recipe, then build. Every beat has to name its type and the Merrill principle it serves; a beat that can name neither is decoration.

Then copy SPEC-TEMPLATE.md to `NN-slug-spec.md` next to where the lesson will live. Fill every field:

- Goal, LO codes (Nick names them), registry rows pasted verbatim.
- Beat map: each beat's id, label, read or lab, recipe, and a word budget. Budgets must sum inside the NEETS band (2400 to 3600 for a teach lesson).
- The one-line unique centerpiece. If you cannot write it in one line, you are about to clone Resistance. DC lessons take it from content/dc-course-router.md.
- Figure plan (which SVG figures, which real photographs) and asset list (photos, mp3).
- Checkpoint plan: item ids from the practice bank, PASS_N. Read `assessment/ASSESSMENT.md` first. Every objective the lesson claims must be tested by at least one item, and the correct answer must move around.
- The teaching prose itself, per beat, at budget, in Nick's voice. Prose is written HERE first, against the book, before any HTML exists. This is the step the weak lessons skipped.

**G0: Nick signs the spec.** Stop and wait. Do not open the stencil until he does.

## S1: Skeleton

Clone chassis/lesson-chassis.html to `NN-slug.html`. Search `SWAP_` and replace every token. All beats from the spec exist with correct ids, gate kinds, HINTS lines, and gateNote text. Checkpoint ITEMS and PASS_N are in. No teaching content yet beyond the spec prose dropped into place.

**G1: run the gate.**

```
python3 <kit>/tools/quality-gate.py NN-slug.html
```

Strict is the default: a missing spec or a missing skills declaration is a FAIL, not a warning. Use `--legacy` only when grading a lesson that shipped before this kit existed.

Chassis, wiring, and placeholder axes must show zero FAILs (writing and richness axes will still be red; that is expected at this stage).

## S2: Build

One beat at a time, in spec order. For each beat: the prose from the spec goes on the page, then the beat's figures, then its poke wired to `__inkGate.ready(id)`. Build only the recipe the spec names. Photos are real photographs with credits. Then the checkpoint feedback lines: every option gets a teaching sentence.

**G2: fully green.** For a NEW lesson this means:

- Zero FAILs on every axis.
- Zero warns in the writing, figures, photos, and interactivity categories. (Legacy shipped lessons are graded at FAIL level only; new lessons clear warns too.)
- Self-review against gold/GOLD-TEARDOWN.md: for each beat, name what the student does and what it changes. A beat that only decorates gets cut or rebuilt.
- Paste the gate scorecard into the -notes.md, and fill its `## Skills and files loaded` section honestly.
- Run `python3 <kit>/tools/quality-gate.py --selfcheck` if anything about the kit felt off during the build.

Then render and look yourself at 1366x768 and a narrow phone, drive every gate like a student (locked Continue, do the poke, Continue enables, fail the check once, retry, pass, Mark lesson complete). Then call Nick to audit (notify-audit script if available). 

**G3: Nick signs the build.** His render-and-look decides taste. Green is the floor, not the finish.

## S3: Ship

Follow ship/SHIP.md: course.json rail entry, assets copied AND listed in the manifest (the caet-dc package shipped four lessons pointing at mp3 files that were never packaged; the gate now catches this), build-course, forward-slash zip rule, deliver.

## Context budget

The builder's context is a quality resource. Spend it on this lesson, not on the workspace.

- Load only the docs in START.md's table for your current stage.
- If the session gets long and quality is sliding (you notice yourself summarizing instead of writing), stop, write the handoff -notes.md, and tell Nick a fresh session should finish it. That is a normal move in this system, not a failure.
