# lesson-factory: START

You are building ONE Electric Ink player lesson for Nick Brown's CAET training library. This folder is the entire operating system for that job. It supersedes every scattered instruction outside it (SOPs, .cursor skills, notes files). If a doc outside this folder contradicts a doc inside it, this folder wins; flag the conflict to Nick.

Works with any LLM. If you can run Python, the gate script does the measuring. If you cannot, self-score against QUALITY-BAR.md by hand and show the table.

## Why this kit exists

Six lessons were built for caet-dc. The first (Resistance) was excellent. The four that followed each passed every rule that existed and still came out thinner: half the figures, zero photographs on a lesson about recognizing a physical tool, prose that slid from training manual to magazine filler. Quality lived in Nick's head, so every fresh session reinterpreted it a little lazier. This kit turns the bar into numbers a script checks, and into gates a lesson cannot skip.

## The system

```
  SPEC ............ BUILD ............ PROVE ............ SHIP
  what this       chassis clone      quality-gate.py    course.json
  lesson must     + prose on the     all axes green     build-course
  teach, at       page + one         + Nick's           SCORM zip
  what depth      unique poke        render-and-look
     |                |                  |                  |
   [G0 Nick        [G1 skeleton      [G2 gate green]    [G3 Nick
    signs spec]     check]           + audit             signs ship]
```

No stage starts until the gate before it is closed. The order is fixed: prose exists before HTML, HTML exists before polish, the script passes before Nick is asked to look.

## Read in this order (and nothing else until needed)

| When | Read | Why |
|---|---|---|
| Now | This file, then PIPELINE.md, then SKILLS-POLICY.md | The job, the gates, and what may never be loaded |
| Before writing the spec | pedagogy/README.md, pedagogy/01-cognitive-goals.md, pedagogy/04-research-foundations.md | Name the cognitive goal and know which effect each beat exploits. Spec stage only. |
| Before writing the spec | chassis/BEAT-TYPES.md | The nine beat types, defined domain-neutral with instantiations for electrical, human factors, safety, wiring, databus, CNS and regulatory lessons. Choose the type for each beat before anything else. |
| Before writing the spec | SPEC-TEMPLATE.md, QUALITY-BAR.md, content/caet-lo-registry.md, chassis/beat-recipes.md | What to plan, at what depth. Recipes are chosen after types, and only for Apply beats. |
| Before writing checkpoint items | assessment/ASSESSMENT.md, then the practice bank | Stems, distractors, feedback, and the integrity rules |
| DC lessons only | content/dc-course-router.md | The unique centerpiece table |
| Before writing prose | voice/NICK-VOICE-STYLE-GUIDE.md, voice/nick-aet-voice.md, voice/voice-examples.md, voice/NICK-AET-CERT-BOOK.md | The voice. Non-negotiable. |
| Before touching HTML | chassis/chassis.md, identity/ELECTRIC-INK-LOCK.md, identity/families.md | Frozen engine, frozen look |
| While building | chassis/lesson-chassis.html (clone it), gold/GOLD-TEARDOWN.md | The stencil and the bar |
| Before calling anything done | QUALITY-BAR.md + run tools/quality-gate.py | The gate |
| Before finishing | NOTES-TEMPLATE.md | The companion notes, including the required skills declaration |
| When shipping | ship/SHIP.md | Package and deliver |

Loading every doc in the workspace makes lessons generic. Load only the rows above for your current stage. The practice bank and lesson sequence stay outside this kit; MANIFEST.md says where they live.

Nothing else may be loaded. The workspace holds fifteen other skill definitions and thirteen stale OneDrive conflict copies, several of which build a different product and will quietly reshape this lesson. `SKILLS-POLICY.md` names every one of them and says which are allowed under what condition. Read it before reaching outside this folder.

## Absolute rules

1. One lesson per session. Never batch. Never carry a previous lesson's context in.
2. No HTML until Nick signs the spec (G0). The spec includes a word budget per beat.
3. Clone chassis/lesson-chassis.html. Never freehand the chassis, never rebuild the dock, gates, Continue, #check, or field card.
4. Never copy Resistance content (rho bench, lattice, color decoder) into another lesson. Steal the engine, never the teaching.
5. Never overwrite a player lesson file with an ungated author draft. That wipes __inkGate.
6. The writing is NEETS training-manual prose: complete sentences, numbered procedures, walked numbers with the rounding admitted, ALL CAPS only on the one rule that saves the meter. Target 2400 to 3600 visible words on a teach lesson. Thin prose fails the gate.
7. Definitions, formulas, and meter steps come from voice/NICK-AET-CERT-BOOK.md. LO wording comes from content/caet-lo-registry.md. Nick names LO codes. Never invent either.
8. Checkpoint items come from the practice bank (see MANIFEST.md). Never open the certification workbook.
9. No em-dashes anywhere, in any file. No magazine fragments as teaching voice. No corporate or AI filler.
10. Declare what you loaded. The companion notes file carries a `## Skills and files loaded` section listing every skill and outside file this session opened. The gate fails a lesson without it, and fails one that declares a blocklisted source.
11. Checkpoint items follow assessment/ASSESSMENT.md and come from the practice bank. Never open the certification workbook, for any reason.
12. Done is a green quality gate plus Nick's own render-and-look. A red axis is never argued down; floors change only when Nick edits them in QUALITY-BAR.md and tools/quality-gate.py.

## How this job has failed before (do not repeat these)

- Straight to HTML with no signed spec: the prose became filler between widgets.
- Batch-building lessons in one long session: the last lessons collapsed (all four weak lessons were gated the same day).
- Cloning the last sibling as the whole page: caught by Nick, rebuilt.
- "Passed the validator" treated as "good": the old validator checked style hygiene, not richness. This kit's gate checks both.
- Calling a lesson done with zero photographs on a recognize-the-part day.
- Writing every checkpoint item with the correct answer as option A. Five of the six shipped caet-dc lessons did this, including the ten-item course check, so a student who always picks A passes the course knowing nothing.
- Loading an old skill (training-architect, a narrative builder, a CardCraft player skill) and quietly building the wrong product.
- Assuming the applied beat types need a physical system, and so writing a human factors or safety lesson as all exposition. An applied beat needs a rule-governed model, and information loss across a handover is one. See BEAT-TYPES.md section 5.

## End of session

Write or update the lesson's companion -notes.md: what was built, what was decided, what is still open, the gate scorecard pasted in. The next session starts from the spec and the notes, not from chat memory.
