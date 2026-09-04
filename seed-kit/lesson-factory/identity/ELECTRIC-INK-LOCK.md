# Locked: Electric Ink (style and idea)
Nick loves this skin. Do not restyle it to NEETS / paper / rails.

Frozen original (do not edit):
`01-resistance.pre-industry-restyle.html`

Working lesson (LOs, KC, Nick voice):
`01-resistance.html`

## Voice
Skill: `nick-aet-voice`. Clone a whole lesson: `electric-ink-builder` (read `objectives.md` and `caet-lo-registry.md` before any LOs). Interaction: `electric-ink-id`. Book: `NICK-AET-CERT-BOOK.md`. Color families: `.cursor/skills/electric-ink-builder/families.md`.

CAET LOs are copied from `.cursor/skills/electric-ink-builder/caet-lo-registry.md`. Nick names codes. Practice items: `PRACTICE-QUESTION-BANK.md`. Student order is `CAET-LESSON-SEQUENCE.md`. The book is voice. Resistance's three on-screen lines were inferred. Swap the five surfaces in that spec when Nick says yes. Color code is craft, not a registry row. Systems gold is ESD (C18).
Voltage = pressure of electrons. Current = flow of electrons. Resistance = opposition to the flow (current) of electricity.
Define it. Symbol. Unit. Series formula. Parallel formula. Then the meter hookup.
Improve muddy lines. Do not flatten into magazine copy. Practice items: `PRACTICE-QUESTION-BANK.md`. Do not open the certification workbook to write a question. The book is how the lesson talks.

## Style
- Dark ink canvas. Raised panels. Hairline rules. Thin sticky lesson dock (identity + waypoint ticks + audio). No left rail, no bottom HUD, no evidence meter.
- Color means a quantity. Amber is R. Cyan is I. Violet is V. Nothing else gets a brand color.
- Type **for the page chrome**: Space Grotesk for display. IBM Plex Sans for body. IBM Plex Mono for numbers, kickers, equations.
- One wide column. A stage plus a control panel. The object is bigger than the prose.
- Kickers over headlines. A callout after the idea, then the poke.
- Hero may carry a short "After this lesson you can" list. That is allowed.

## Cards vs chrome (locked 2026-08-28, overridden same day)

Page chrome **and** the 16:9 teaching stages use Electric Ink. Dark ink, Space Grotesk / IBM Plex, amber `--R`, cyan `--I`, violet `--V`. Do not drop Newsreader, Hanken Grotesk, paper `#f4f0e7`, or green `#145c4f` into this lesson.

The gold paper file (`CardCraft-Library/cards/03-interactive-labs/aero-slide-types-beyond-video.html`) is the public extract's AERO register. Steal the **job**, not the paper skin.

Do not use class `.stage` for those cards. The rho bench already owns `.stage`. Use `.cc-card` / `.cc-stage`. Do not print "CardCraft" on a kicker.

Job first. Catalog 09 Sequence It is procedure order with a real consequence. Ohms on this page is membership: meter setup is anytime; probes wait for OFF + isolate; live-bus ohms is NEVER. Continue still unlocks on 100.0 Ω on R1, not on a sort check.

Catalog 10 Wipe is good vs bad on **the same picture**. Two different hookups (volts vs amps) is not a wipe. Do not ship a dead audio seek (`max="0"`).

Failed 2026-08-28: copied CardCraft JS into Electric Ink CSS. Nick saw a Resistance clone and a slider. That pass is not the bar. The paper-stage pass the same day is also not the bar. Nick reviewed it: color did not match, and Sequence It forced an order the shop does not require.

## Idea
- One live bench. Student sets material, length, area, temperature. R = rho L / A times temperature. Current is computed on a 12 V source with a 10 ohm load.
- Predict before the first poke. Then the bench proves it.
- Isolate vs in-circuit on that same specimen.
- A lattice you can drag is the same physics from the inside (scatter, drift). It is not a second lesson.
- Shop ticket: Cirrus fan, 13.6 V bus, 9.1 V at the load. Extra series R. Fix the path, not the fan.
- Types family: click-to-flip. Schematic front, real photograph back, one recognition line. Five cards. Not a game.
- Knowledge check: steal `#check` **state machine**. Items from `PRACTICE-QUESTION-BANK.md`. Retry on a miss. No overlay popup. Next is Replay the bench, not a 6/6 gate.
- Conclusion: CardCraft field card (three LO plates + one synth strip), not a prose wall.
- Lesson dock: sticky bar, not a webpage chrome. Identity + tappable `data-beat` rail + honest audio. Clone by changing `#ldock` data-course / data-num / data-title, the audio src, and `data-beat` on each section.

## Honest dents still open (Resistance is shippable)

Nick signed the player file 2026-08-28: ship it. Do not call the author-folder HTML finished. Do not restyle. Next-pass only, do not block Voltage:

- `ready()` scrolls Continue into view. Stay put. They were still in that area.
- Color lab gates on 3 of 3. Gate once: first correct decode.
- Dock ticks have no hover name + hint. Next lesson gets the popover.
- No Ohm portrait next to the bio. Figure, not a beat. Wikimedia. Full timeline stays on C07.
- Lattice and bench do not share state. Two material rows, two temps.

## Do not copy from the paper restyle
Rail, Evidence 0/6, HUD, Next Lesson lock, Thinkific CSP, NEETS footer as required chrome.

## How later files steal
Same ink. Same color law. Same `__inkGate` / Continue. Same Checkpoint **state machine**. Same Nick voice. The **poke** is unique: `electric-ink-chassis/beat-recipes.md`. DC C-numbers also use `COURSE-SKILL-ROUTER.md`. Do not copy Resistance's lattice, color decoder, or rho bench into Voltage, HF, or ARINC.

Clone stencil: `electric-ink-chassis/lesson-chassis.html`. Chassis contract: `.cursor/skills/electric-ink-id/chassis.md`. Live proof is the **player** Resistance file, not this folder's author HTML.

## Author vs hangar (locked 2026-08-27, player signed 2026-08-28)

This folder is where Nick authors Electric Ink HTML. The **player** Resistance file is shippable. Do not restyle these author files to match the hangar. Do not copy this folder's author file onto the player copy. That wipes `__inkGate`.

The **gate chassis** (dock ticks, Continue, `__inkGate`, `#ldHint`) lives in `AERO-Player/courses/caet-dc/lessons/01-resistance.html`. Copying this folder's author file onto the player copy wipes that chassis. Merge content in. Do not overwrite.

The student hub is the ACE app (`CAET/AP-Prep-Course`): hangar, bays, date to test, games, existing progress. A day is Teach (this HTML) + Worksheet + Games. No Drill. See `HANGAR-LOCK.md`. First bay label is Safety. Phases: CAET, then A&P, then Advanced.
