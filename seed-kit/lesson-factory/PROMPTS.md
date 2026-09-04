# PROMPTS: paste one of these into any LLM session

Each prompt assumes the session can see the lesson-factory folder (attached, mounted, or in the repo). Adjust the path if the kit lives somewhere else. One lesson per session, always.

Do not paste an old skill into the opening prompt. The kit's policy stops a model from wandering off and finding one, but nothing stops a model using what a person hands it directly. That is the one hole only you can close.

## 1. Build a new lesson

```
You are building ONE Electric Ink player lesson for the CAET training library.

Read lesson-factory/START.md first and follow it exactly. We are at stage S0:
produce the spec only, using lesson-factory/SPEC-TEMPLATE.md. Do not write any
HTML until I sign the spec.

Topic:
C-number and filename:
LO codes:
Minutes:
Family (DC or Systems):
Audio: none yet
```

## 2. Continue a lesson already in flight

```
You are continuing ONE Electric Ink player lesson. Read lesson-factory/START.md,
then the lesson's NN-slug-spec.md and NN-slug-notes.md. Resume at the stage the
notes name. Do not redesign anything the spec locked. Before calling any stage
done, run lesson-factory/tools/quality-gate.py and paste the scorecard.

Lesson file:
```

## 3. Bring a shipped lesson up to the bar

```
You are upgrading ONE shipped lesson to the lesson-factory quality bar without
touching its frozen chassis. Read lesson-factory/START.md, QUALITY-BAR.md, and
gold/GOLD-TEARDOWN.md. Run tools/quality-gate.py on the lesson, then fix ONLY
the red and warned axes: deepen prose to the NEETS band in Nick's voice, add
the missing figures or photographs with credits, keep every existing gate id
and the dock intact. Never overwrite the file with a rewrite; edit in place.
Rerun the gate after each fix and paste the before and after scorecards.

Lesson file:
```

## 4. Audit only (no changes)

```
Run lesson-factory/tools/quality-gate.py --course <lessons folder> --legacy and
report: the scorecard, the three worst axes per failing lesson, and the single
highest leverage fix for each. Change nothing.
```

## 5. Check the kit itself is still clean

```
Run lesson-factory/tools/quality-gate.py --selfcheck and report what it found.
If it names conflict copies, blocklisted files, or drifted copies, list them and
tell me what each one would have done to a build. Change nothing without asking.
```
