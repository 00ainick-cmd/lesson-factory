# QUALITY-BAR: the contract

"As good as Resistance" is not a feeling here. It is this table. The same numbers live in `tools/quality-gate.py` (CONFIG block). Only Nick changes them, in both places, on purpose. A builder never argues a red axis down and never edits a floor to pass.

Two bars stack:

- **Craft bar: Resistance.** Figures, photos, gated interactions, per-option teaching feedback. The gold file sets these floors.
- **Prose bar: NEETS manual.** Nick's standing correction: lessons are text heavy at training-manual density, written tight. This bar sits ABOVE the gold file, whose prose Nick also wants deepened. New lessons meet both.

## The axes

| Axis | FAIL under | Target | Gold measured |
|---|---|---|---|
| Visible words (teach lesson) | 1800 | 2400 to 3600 | 2079 |
| Punch-fragment rate | 30% | under 22% | 19% |
| Numbered procedure present | none | 1+ | yes |
| Walked numbers with units in prose | warn under 6 | plenty | 11 |
| SVG figures per minute | 0.35 | 0.50 | 0.50 |
| Real photographs | 0 | 3+ | 5 |
| __inkGate.ready call sites | under 3 | 4+ | 6 |
| Gated beats (data-need) | under 4 | spec's beat map | 8 |
| AeroLesson.interaction posts | warn under 2 | 3 | 3 |
| Checkpoint ITEMS | under 5 | spec | 5, pass 4 |
| Teaching string per item | warn | every option teaches | yes |
| Sameness vs any sibling (8-gram overlap) | 30% | under 20% | 2 to 6% |
| Chassis integrity (dock, gates, #check, bridge, field card) | any missing | all present | all present |
| Style floor (em-dashes, 100vh, external deps, banned phrases, focus, reduced-motion) | per rule | clean | clean |
| Assets referenced exist on disk | any missing | all present | all present |
| Spec file exists and Nick signed it | missing | signed | n/a (predates kit) |
| Skills declaration in the notes file | missing, or names a blocklisted source | present and honest | n/a (predates kit) |
| OneDrive conflict copies beside the lesson | any present | none | none |
| Negative stems, all-of-the-above | any | none | none |
| Feedback line per option | count mismatch | one per option | yes |
| Objective coverage by items | fewer distinct lo tags than objectives claimed | every objective tested | 3 tags, 2 objectives |
| Correct answer position spread | same position on every item | varied | varied (A,B,A,A,B) |
| Correct answer is longest option | warn at 60% of items | under that | 4 of 5 (a known dent) |

Minutes come from course.json (or --minutes). The course-check profile skips the richness and prose axes and raises the ITEMS floor to 10.

## What NEETS-manual writing means here

Complete sentences that carry technical content. Numbered how-tos for every procedure. One number walked all the way through with the rounding admitted. Definitions in the book's exact wording (voice/NICK-AET-CERT-BOOK.md). ALL CAPS reserved for the one rule that saves the meter or the technician. Aircraft examples only when they earn the idea. No kicker poetry, no punch fragments as teaching, no "Hold onto this," no water tank outside Voltage.

## Calibration proof (2026-08-30)

The gate was tuned against the shipped caet-dc course and lands exactly on Nick's felt ranking:

```
file                       min  words  svg  img  ready  fails  verdict
01-resistance.html          30   2079   15    5      6      0   WARN (known dents only)
04-voltage.html             20   1943   12    3      3      1   FAIL
05-current.html             20   1622   11    1      3      2   FAIL
07-ohms-law.html            22   2177    7    1      3      2   FAIL
08-multimeter.html          22   1642    8    0      3      3   FAIL
09-course-check.html        12    479    3    0      2      0   WARN
```

Red flags it raised, all real: Multimeter has zero photographs and thin prose; Current has thin prose; Ohm's Law has half the gold figure density; all four clones reference mp3 audio that was never packaged or listed in the SCORM manifest.

The assessment checks then found a worse one. In five of the six lessons the correct answer is option A on **every** item, including the ten-item course check that gates completion. A student who always picks A passes the course. Only Resistance varies its answer positions.

## Running it

```
python3 tools/quality-gate.py lesson.html                 one lesson (strict, the default)
python3 tools/quality-gate.py --course <lessons folder>   whole course + sameness matrix
python3 tools/quality-gate.py lesson.html --prose         list offending sentences
python3 tools/quality-gate.py lesson.html --legacy        grade a lesson that shipped pre-kit
python3 tools/quality-gate.py --selfcheck                 is the kit itself still clean
```

No Python available? Score every row of the table above by hand and paste the filled table in your report. The numbers are countable in any editor.

## Raising the bar

When Nick wants the library tighter, he raises a floor here and in the CONFIG block, and the whole future library moves. That is the point: the bar lives in one file, not in anyone's memory.
