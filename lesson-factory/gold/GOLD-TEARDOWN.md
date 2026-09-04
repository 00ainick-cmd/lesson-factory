# GOLD-TEARDOWN: why 01-resistance.html is the bar

The player Resistance file sits in this folder as the reference build (also live at `AERO-Player/courses/caet-dc/lessons/01-resistance.html`; keep them in sync if the player copy changes). Its measured numbers are in `gold-metrics.json` and in QUALITY-BAR.md. This teardown is what you read INSTEAD of opening the gold HTML to borrow content. Open the HTML only to answer a wiring question about the engine.

## The shape

30 minutes, 11 beats, every one earning its place:

| Beat | Kind | What the student does | Why it works |
|---|---|---|---|
| Start | read | Title, one-line definition, symbol, unit, LO rows, Begin | The book's spine, on screen in seconds |
| Cirrus | read | A real shop ticket: 13.6 V bus, 9.1 V at the fan | The floor reason. Measured numbers, no drama |
| Define | read | His book sentence, the V/I/R cards | Definition before physics |
| Bench | lab | Predict, then drive material, length, area, temperature; R and I recompute | Predict-then-poke; the prediction moves the object |
| Lattice | lab | Drag inside the conductor; same physics from the inside | A second angle, not a second lesson |
| Types | lab | Flip five cards: schematic front, real photograph back | Recognition needs the real part |
| Networks | lab | Add and pull parts; series total falls, parallel total rises | The rule performed, not stated |
| Color | lab | Build values on the 4-band decoder | The shop skill |
| Ohms | lab | Drive a virtual meter to a true reading, power OFF, part isolated | The one rule that saves the meter, in caps |
| Check | lab | 5 items, pass 4, a teaching sentence on every option, retry | Auto-graded, honest |
| Field card | closeout | One plate per LO, Mark lesson complete | Answers the LOs, not a takeaways wall |

Six `__inkGate.ready` sites. Three AeroLesson.interaction posts. 15 SVG figures, 5 real photographs, 2 canvas sims, 71 KB of bespoke interaction code. Nothing decorates; every interactive changes a readout or a recognition.

## Steal / never copy

Steal from the gold file (engine, not teaching): the dock and tick behavior, `__inkGate` and gatebars, the #check state machine, the field-card shell, token CSS, the AeroLesson bridge calls, the -notes.md shape.

Never copy into another lesson: the rho bench, the drag lattice, the color decoder, the Cirrus 13.6/9.1 numbers, the resistor photos, the map-card copy, the checkpoint stems, the 11-beat list itself. Your beat map comes from YOUR spec. A student who took Resistance must never feel they opened Resistance again.

## Honest dents (signed shippable 2026-08-28; fix on next pass, do not repeat in new lessons)

- `ready()` scrolls Continue into view. New lessons stay put.
- Color lab gates on 3 of 3. New lessons gate once, on the first real action.
- Dock ticks have no hover popover (name + hint). New lessons get it.
- Prose sits below the NEETS band (2079 words at 30 min). New lessons land 2400 to 3600 with tighter manual writing, per the standing correction.
- Lattice and bench do not share state.

The gold file is the craft bar with known dents, not scripture. The contract in QUALITY-BAR.md is what new lessons must beat.
