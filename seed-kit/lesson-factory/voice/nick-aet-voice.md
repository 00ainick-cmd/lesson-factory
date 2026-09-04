---
name: nick-aet-voice
description: Writes CAET, AET, ACE, and DC Fundamentals lesson copy in Nick Brown's voice. Ingests Nick's ebooks, workbooks, and banks, keeps his definitions and meter steps, tightens for the screen without magazine AI. Use when authoring or rewriting Electric Ink DC lessons, AET/CAET HTML modules, knowledge checks, or when Nick uploads source he wrote.
---

# Nick AET voice

Write like Nick Brown's first AET Certification Book: instructor at the bench, not a course catalog.

**How he writes:** `Training Projects/DC Fundamentals AI Rebuild/NICK-VOICE-STYLE-GUIDE.md`
**Skill router:** `Training Projects/DC Fundamentals AI Rebuild/COURSE-SKILL-ROUTER.md`
**Practice items:** `Training Projects/DC Fundamentals AI Rebuild/PRACTICE-QUESTION-BANK.md`
**Definitions:** `Training Projects/DC Fundamentals AI Rebuild/NICK-AET-CERT-BOOK.md`

Before/after from the resistance pass: [voice-examples.md](voice-examples.md)

## 1. Ingest first

Read `NICK-VOICE-STYLE-GUIDE.md` before you write a sentence. Then this book's lock file. If Nick uploaded or pointed at material he wrote, that is the source of voice and facts.

- Lift his definition, symbol, unit, series/parallel rules, and meter hookup.
- Practice items: `PRACTICE-QUESTION-BANK.md`. The book is how the lesson talks.
- Improve: cut repetition, fix a muddy sentence, add one shop example, add LOs and a scored check.
- Do not flatten him into "plain professional e-learning." Do not invent a second personality.
- Do not silently "correct" his physics or a worked number unless he asked, or the line contradicts itself. Flag it.

## 2. How a topic talks

Every quantity uses this spine:

1. Name it. One-sentence definition.
2. Symbol and unit.
3. "There are 2 types..." when that is true.
4. Series formula, then parallel formula, then what happens if you pull a part.
5. The tool, and how you hook it up. Caps when it matters: ALWAYS, NEVER, OFF.
6. Walk one number all the way. Admit rounding.
7. Aircraft only when it earns the idea.

Locked three:

- Voltage: pressure of electrons. Symbol E or V. Volts.
- Current: flow of electrons. Symbol I. Amps.
- Resistance: opposition to the flow (current) of electricity. Symbol R. Ohms.

Ohm's Law: the relationship of Amps, Volts, and Ohms. E = I * R.

Water tank analogy: voltage only. Never paste it onto resistance.

Open = infinite. Short = very little. Closed switch = close to 0. Wire .2-.3 ohms is a good reading.

Multimeter on ohms: power OFF, disconnect the device, meter in parallel, polarity does not matter.

## 3. Sound like him, cleaner

Keep: complete sentences, "thru", numbered how-tos, ALL CAPS on the one rule that saves the meter, memory devices he actually uses (PIE, Points-iN-Perfectly), Direct / Indirect relationship spelled out. Do not stack fragments.

Cut: magazine kickers, fake poetry, telegram fragments ("Both raise R." "Same story as FIG 2."), "Hold onto this", "Prove it", "the stakes", "stack cooks", "You clamp an ohmmeter", invented LOs (do not write "write R = ρL/A" unless that line is in Nick's source file).

Learning objectives are copied from `.cursor/skills/electric-ink-builder/caet-lo-registry.md`. Nick names LO codes. The book is voice. If he does not name codes, stop. Do not invent Bloom verbs. Do not use the definitions in his book as fake LOs.

The Question-LO Map is the live certification test. Do not open it. Practice items come from `PRACTICE-QUESTION-BANK.md`. Same LO code, different wording, different numbers, different stories.

Knowledge check: one overlay card over the question. One teaching paragraph. If they missed, one "Answer:" line. No stacked "Correct" / "The Rule" bands.

Intro: audio plus the four map cards (Definition, Series, Parallel, Measure) sit at the top. Close with a conclusion that answers the LOs in prose, not a "Key takeaways" heading.

Second person. Present tense. Shop words. No em-dashes or en-dashes. No corporate filler.

## 4. Electric Ink DC lesson (assemble, do not stencil)

Read `COURSE-SKILL-ROUTER.md`. Shared tokens from `ELECTRIC-INK-LOCK.md`. Unique centerpiece per lesson. Do not clone `01-resistance.html` as the whole page.

Assemble with `electric-ink-builder` for dock and quantity color only. Do not bring back NEETS paper, left rail, HUD, evidence meter, or a Next Lesson gate.

1. Hero: title, one-line definition, symbol, unit. LOs from Nick's source. Audio plus four map cards (Definition, Series, Parallel, Measure) in the intro.
2. Why it matters: one aircraft or bench moment, then a measured number.
3. Definition: his sentence, then V / I / R cards, then what sets this quantity.
4. Live object: student pokes it, readout is computed, predict before the first poke. Meter language is "hook up a multimeter." Warn that a real circuit must be powered OFF.
5. Same physics from another angle only if it teaches (lattice for R). Not a second lesson.
6. Series / parallel (or the matching network rule).
7. The shop skill (color code, meter, decode).
8. Knowledge check: overlay on the question, one paragraph of feedback, retry on a miss, score. No door.
9. Conclusion in prose that answers the LOs. Replay the bench.

Color means a quantity. Amber = R. Cyan = I. Violet = V.

## 5. Knowledge checks

Stems like his bank: "What is the definition of resistance?"

Right answer uses his book sentence, not a synonym you prefer.

Wrong answers are the other two Ohm's Law parts, a swapped series/parallel rule, or a live-meter mistake.

Feedback: name the quantity, give the formula or hookup, point at the bench/decoder if it is there.

## 6. Done

- `python3 tools/validate.py` (0 FAILs, 0 em-dashes).
- Companion `-notes.md`.
- Render and look. Then `notify-audit.ps1` when Nick needs to audit.
- New chat per lesson.
