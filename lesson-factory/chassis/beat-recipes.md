# Beat recipes (what goes inside the chassis)

The chassis is the dock, gates, Continue, check, and field card. It is not a DC lesson shape.

Every CAET day from `CAET Daily Lesson Plans.html` is the same spine. The **poke** changes. Pick the recipe from the day's goal, not from Resistance.

Sellable Human Factors catalog (hf1-m2, complacency.html) keeps its own field-manual skin. CAET week 2 HF (LO 8.6) uses this chassis.

## Spine (every lesson)

1. **Start** (read, required). Title, one-line goal, the LO rows for this day, Begin.
2. **Why** (read, optional). One floor reason. Drop it if the poke already is the reason.
3. **Poke** (lab, required). One recipe from the menu below. Add a second poke only if this day has two jobs (example: meters is placement AND the dead-circuit rule).
4. **Check** (lab, required). Same `#check` engine. ITEMS from the practice bank for this LO.
5. **Field card** (closeout, required). One plate per LO this day owns. Not always three.

Do not keep a Define / Symbol / Unit row, a schematic flip, or a rho bench because the stencil once showed them.

## Recipe menu

| Recipe | The student does | Ready when | Use on days like |
|---|---|---|---|
| **lookup** | Find the right slot (SDS section, FAR, form field, fire class) | They pick the matching slot | W1 D1 SDS. W9 records. Extinguisher class. |
| **sequence** | Put steps in order | The order is correct, or they commit and see the save | W1 D2 electrical contact (power, person, treat). ESD station setup. Only if order has a consequence. |
| **membership** | Sort into anytime / must / never | Columns are right. Does **not** unlock Continue if a lab sits under it | Ohmmeter setup vs OFF-then-probes. Any procedure where meter prep can come first. |
| **decide** | Make a shop call on a short scenario | They pick a call and see the teaching line | W2 D1 Dirty Dozen. W2 D2 what to say next. W1 D5 missing tool. W9 classify the job. |
| **compare** | Tell two things apart on the same frame | They mark the difference | Shielded bag vs pink poly. AC vs DC. 429 vs 1553. ADS-B Out vs In. |
| **recognize** | Flip: name / glyph / photo of a real part | One flip | Resistor types. Lighting families. Traditional vs glass instrument. Antenna. |
| **bench** | Change a quantity, watch the readout | Predict **or** one control change, whichever comes first | Voltage, current, resistance, Ohm, series, parallel. |
| **meter** | Drive a virtual instrument on a numbered how-to | The true win path | W3 D5 meters. Ohms / volts / amps as their own days. |
| **scope** | Read a trace (voltage vs time, flag, OL) | They name what the display is saying | W4 D5 oscilloscopes. EFIS red X. Blocked pitot indications. |
| **trace** | Follow a chain (bus to load, audio path, pitot-static plumbing) | They tap the faulted block | Lighting dead vs dim. No-sidetone. Pitot vs static. Databus who talks. |

One poke per beat. If it only decorates, cut it.

## Map (9 weeks, not a second skin)

| Week | Typical recipes | Do not steal from Resistance |
|---|---|---|
| 1 Safety | lookup, sequence, decide | Lattice, color decoder |
| 2 HF + atoms to current | decide (HF). bench (V, I) | HF is not a resistor flip |
| 3 DC + meters | bench, meter | Keep bench unique per quantity |
| 4 AC | compare, bench, scope | Electron lattice taught R |
| 5 Semiconductors, logic, lighting | recognize, compare, trace | Color code |
| 6 Wiring | recognize, sequence, trace | Rho bench |
| 7 Databus, glass | compare, trace, decide (flag) | |
| 8 CNS | compare, trace, lookup (band, mode) | |
| 9 Regs, pitot-static | decide, trace, lookup (91.411 / 91.413) | Invented accident specifics |

## How to assemble a day

1. Open the daily plan. Copy the **goal** and the **concepts taught**. Those are the blocks.
2. Clone `lesson-chassis.html`. Search `SWAP_`.
3. Pick **one** recipe for the poke. Build only that. Call `__inkGate.ready("poke")` on the real action.
4. Drop Why if the goal is already the reason.
5. Field card plates = this day's LO chips, not a three-card habit.
6. Checkpoint ITEMS test the goal, not the chassis.
7. Stay put: `ready()` does not scroll. Gate once: first real action unlocks. New lessons get dock hover (name + hint). Do not clone Resistance's 11 beats.

Chrome family: DC weeks use quantity color (`--R` `--I` `--V`). From ESD (C18) on, retoken chrome to `--hero` (`families.md`). Do not invent a third skin for HF or CNS.
