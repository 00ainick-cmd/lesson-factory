# Nick voice style guide (AET / CAET / Electric Ink)

Read this before you write or rewrite any sentence in the Ohm's Law / DC course. Then read `NICK-AET-CERT-BOOK.md` for locked definitions and numbers. Then read `COURSE-SKILL-ROUTER.md` for which builder skill this beat needs. Checkpoint items come from `PRACTICE-QUESTION-BANK.md`. Do not clone `01-resistance.html` as a whole page.

Author: Nick Brown, Aircraft Electronics Technician (AET) Certification Book (first ebook). This file is HOW he talks. The book lock is WHAT he said. The GMetrix bank is the live certification test. Do not open it. Practice items: `PRACTICE-QUESTION-BANK.md`.

If a draft does not sound like this guide, it is wrong even if the physics is right.

---

## 1. What "NEETS-like" means here

NEETS is the **instructional depth**, not the skin.

Do:

- Teach like a Navy module: name it, define it, give the symbol and unit, show the schematic, walk a number, then the tool, then the fault.
- Stay on one idea until the student can do it. Then the next idea.
- Worked examples with the expert's reasoning visible at each step, not just the answer.
- Numbered hookups. Caps on the rule that blows a fuse or wrecks a meter.
- Admit rounding. Check the math by adding the drops back to the source.

Do not:

- Restyle Electric Ink to paper, Fraunces, a left rail, a HUD, or a "NEETS shell." Locked in `ELECTRIC-INK-LOCK.md`.
- Write magazine kickers, telegram headlines, or fake poetry.
- Invent a second personality that is "more professional" than the book.

Look stays Electric Ink: dark ink, Space Grotesk / IBM Plex, `#ldock`, quantity colors (violet V, cyan I, amber R). Depth is the book.

---

## 2. Who you are on the page

Second person. Present tense. Instructor at the bench talking to a tech who has the meter in their hand.

You are not a catalog, a TED talk, or a safety poster. You do not "explore concepts." You name the quantity, give the formula, walk the number, then say how to hook up the meter.

Informal where it helps: oscope, meat hook, thru, pretty basic tool. Not slang for its own sake.

---

## 3. The spine (every quantity, every lesson)

Use this order. Skip a step only if the lesson truly does not own it.

1. **Name it.** One sentence definition. Use his words.
2. **Symbol and unit.** "The symbol for voltage is either E or V." "The unit of measurement is Amps. The symbol for current is I."
3. **There are 2 types...** when that is true. Name both in the same breath. Fixed / variable. Electron flow / conventional flow. Series / parallel.
4. **Series formula, then parallel formula.** Then what happens if you pull a part.
5. **The tool.** Numbered how-to. Power ON or OFF in the first step. ALWAYS / NEVER on the line that saves the meter.
6. **Walk one number all the way.** Show the rearrangement. Admit rounding. Check by adding back.
7. **Aircraft only when it earns the idea.** Battery on the aircraft. Landing gear AND. Pressurization OR. Not decoration.

Power is the fourth part. It does not technically fall under Ohm's Law. Say that. Then PIE. Then power adds. Then 1 HP = 747 W and ignore efficiency.

---

## 4. Sentence rules

Write complete sentences. Subject, verb, object. If a headline could be barked by a drill sergeant in four words, rewrite it.

| Do not write | Write |
|---|---|
| Read the drop. Power stays ON. | Leave the circuit live. Put the meter across the part. |
| Tap the source. | Voltage on the airplane comes from the battery, the bus, or the generator. Click a card. |
| Source or drop. Tap, then tap a bin. | Same unit, different job. Tap a ticket, then tap the bin it belongs in. |
| Series adds. Parallel stays. | In series, voltage adds. In parallel, voltage stays the same. |
| Both raise R. | If you remove a resistor in a parallel circuit, total resistance will increase. |

Allowed short lines: formula lines (`Et = E1 + E2 + En`), ALWAYS / NEVER rules, map-card labels (Definition, Series, Parallel, Measure). Those are labels, not body copy.

Paragraphs are short. Two to five sentences. Then a formula or a figure. Then the next beat.

Use "thru" the way he does for current through a meter or a device. Use "hooked up" and "place the meter." Do not write "utilize," "ensure that learners," or "it is important to note that" as filler. He does say "it is important" when the meter or a fuse is on the line. Keep that. Cut the rest.

No em-dashes. No en-dashes. Commas, colons, periods, parentheses, or a spaced hyphen.

No stacked fragments. One idea per sentence. Then the next.

---

## 5. How a definition sounds (lift these)

Do not paraphrase these into a synonym you prefer. The checkpoint right answer uses the book sentence.

- Electricity is the study of the movement of electrons and how that movement causes things to do work.
- Direct current is electricity that only moves in one direction.
- There are three requirements in a practical circuit: Voltage Source, Conductor, and a Load.
- Series circuits only have 1 path for electricity to flow. Parallel circuits have more than 1 path.
- Ohm's Law is the relationship of Amps, Volts, and Ohms. As an equation, E = I * R.
- Current is the flow of electrons. Unit: Amps. Symbol: I.
- Voltage is the pressure of electrons. Unit: volts. Symbol: E or V.
- Resistance is the opposition to the flow (current) of electricity. Unit: Ohms. Symbol: R.
- Power is the work produced. Symbol: P. Unit: Watts. P = I * E (PIE).
- Kirchhoff: the algebraic sum of all voltage drops will equal the source voltage.

Water tank: voltage only. "To use a water analogy, voltage is like the water pressure coming out of a water tank. The bigger the tank, the higher the voltage." Never paste that onto current or resistance in this course unless Nick explicitly asks for that one clip.

---

## 6. How a formula sounds

State the rule in words, then the equation, then what happens if you pull a part.

> In a series circuit, voltage increases (Et = E1 + E2 + En). This is common in batteries where you need a higher voltage. Batteries are wired up in series to get a higher voltage. Therefore, voltage in series adds up. In parallel, voltage stays the same (Et = E1 = E2 = En).

> In a series circuit, Resistance adds up (Rt = R1 + R2 + Rn). If you remove a resistor in a series circuit, total resistance will decrease. In a parallel circuit total resistance is the reciprocal of the sum of the individual reciprocals. If you remove a resistor in a parallel circuit, total resistance will increase.

Direct / Indirect relationship: spell it out, often in caps.

> Ohm's law states that Voltage (E) is directly proportional to Current (I) and indirectly proportional to Resistance (R).

> Xl has a Direct Relationship with Inductance (L) and Frequency (F), so if either F or L INCREASE, Xl will INCREASE.

Relationships he actually uses: Direct, Indirect. PIE. Points-iN-Perfectly (PNP) and Never Points-iN (NPN). Do not invent new acronyms.

---

## 7. How a worked example sounds (clone this)

He does not dump the answer. He numbers the steps, rearranges Ohm's Law, then checks.

Gold walk (every DC lesson that calculates may reuse these parts, not new exam numbers):

R1 = 20, R2 = 15, R3 = 30, E = 9 V.

1. Find Rt by adding the resistors. Rt = 65.
2. Use Ohm's Law. 9 V = 65 ohms * I. 9/65, I = .13 A.
3. Series: current stays constant.
4. Drops: E = I * R. 2.6 V, 1.95 V, 3.9 V.
5. Add them back: 2.6 + 1.95 + 3.9 = 8.45, close to 9 because of rounding.
6. Name the law: Kirchhoff.

On a live bench, use unrounded current so the sum lands on 9.00 V. Put that next to the paper walk. Do not hide the 8.45. The leftover is rounding, not missing volts.

Key takeaways in his close (prose, not a poster list):

- SERIES: one path. Power is consumed. Voltage is dropped across the loads. Current stays the same. Total resistance is the sum.
- PARALLEL: more than 1 path. Power is consumed. Voltage stays the same. Current adds and is divided amongst the branches. Total resistance is the reciprocal of the sum of the individual reciprocals.

---

## 8. How a tool sounds (clone the lists)

Numbered. Power is step one. Jack, then dial, then where the probes go. Polarity when it matters.

**Voltmeter**

1. Ensure power to the circuit is on.
2. Move the red probe to V.
3. Place the meter in parallel (or over) the device. Red toward the anode, black toward the cathode. This will measure the voltage drop of the device.

**Ammeter**

1. Ensure power to the circuit is on.
2. Move the red probe to A. If the number is too large, then move to mA/uA. Do not start on the small jack. You may blow the fuse.
3. Turn the dial to A. On most Fluke meters, push the yellow button for AC/DC. ALWAYS check the LCD.
4. Place the meter in series so current runs thru the meter. Red toward the anode, black toward the cathode. Break the circuit at the battery or the light if that is the easy access.

**Ohmmeter**

1. Ensure power is OFF.
2. Ensure the device is disconnected from the rest of the circuit. You only want the device, not the whole circuit.
3. Place the meter in parallel over the device. Polarity does not matter.

ALWAYS / NEVER is for the line that costs a fuse or a meter. One or two per lesson, not a shout on every paragraph.

---

## 9. Faults and shop talk

He teaches faults as readings, not drama.

- Open: infinite resistance. Blown resistor or other component.
- Short: very little resistance.
- Closed switch: close to 0 ohms.
- Wire: .2-.3 ohms is a good reading.
- If you suspect 0 volts, check it with a voltmeter.

Troubleshooting voice: "the easiest way to troubleshoot." "ONLY measuring voltage is inconclusive. You must check the resistance." That bluntness stays.

---

## 10. Color code (his worked example)

4-band: first digit, second digit, multiplier (number of zeros), fourth = tolerance.

Silver and Gold are NEVER the first band. Only the fourth band.

Red, Orange, Blue, Silver = 23,000,000 +/- 10%. Walk it digit by digit the way he does. Do not skip to the answer.

---

## 11. What to clean vs what to keep

Keep his physics, his numbers, his hookups, his memory devices, his rounding admission.

Clean for the screen:

- OCR garbage and typos (second "bad" for band, "Know you know," garbled fraction glyphs). Write the parallel formula in words plus a clean equation.
- Repeated "it is important" when nothing is at risk.
- "visa-versa" may stay as "vice versa" unless you are quoting.
- Binary line in the book that says "one for zero which represent on and off" is muddy. Flag it. Do not silently invent a new definition if you are in a later module. For DC, you will not need it.

Do not "correct" .13 A to 0.138 A in the paper walk. Both live on the page: paper rounding, then the live strip.

Do not replace opposition with stoppage. Some tests say stoppage. The lesson follows the book.

---

## 12. Words you never write

Hold onto this. Prove it. The stakes. Delve. Tapestry. Award-winning. Real physics, not a cartoon. CardCraft 05. Explorable schematic. That is this lesson. Every wire fights. Picture water in a pipe (on a resistance or current page). Utilize. Learners will be able to. Let's dive in. In today's world.

Do not write learning objectives in Bloom verbs you invented. Copy registry rows from `.cursor/skills/electric-ink-builder/caet-lo-registry.md` when Nick names the codes. Practice items: `PRACTICE-QUESTION-BANK.md`. The book is voice, not a fake LO list.

---

## 13. Interactions (NEETS depth, Electric Ink poke)

A NEETS module would give a figure, an example, then a problem. On screen that is:

- Predict before the first poke. The guess stays visible when the bench moves.
- One live object. Readouts are computed, not faked.
- Types: schematic on the front, real photograph on the back, one recognition line.
- Networks: add or remove a part. Series total goes one way. Parallel the other. Say it in a complete sentence after the click.
- Meter lab: numbered hookup in prose beside the virtual meter. The fuse teaches the wrong jack.
- Check: auto-graded. One teaching paragraph on the choice they picked. Retry on a miss. Original stems. Same LO, different numbers, different story.

If the student only watches numbers change, the interaction failed. The diagram or the meter has to change.

---

## 14. Draft check (run before you show Nick)

- Can you hear him saying this sentence at a bench? If it sounds like a course catalog, rewrite.
- Did you use his definition, symbol, unit, series rule, parallel rule, and hookup?
- Is every headline a complete thought, not a bark?
- Did you walk one number and admit rounding?
- Did you put ALWAYS / NEVER only on the meter rule?
- Zero em-dashes. Companion `-notes.md`. Shared Electric Ink tokens. Unique centerpiece.

---

## 15. Files

| File | Job |
|---|---|
| This file | How to write |
| `NICK-AET-CERT-BOOK.md` | Locked definitions and later-module facts |
| `COURSE-SKILL-ROUTER.md` | Which skill this beat needs |
| `PRACTICE-QUESTION-BANK.md` | Checkpoint stems (never the certification workbook) |
| `ELECTRIC-INK-LOCK.md` | Shared tokens. Do not restyle |
| `CAET-LESSON-SEQUENCE.md` | Student order and LO codes |
| `nick-aet-voice` skill | Load this guide first |

Ohm's Law / electricity HTML in this folder (finalize these, new chat per file):

- `04-voltage.html` (C04)
- `05-current.html` (C05)
- `01-resistance.html` (C06, filename stays)
- `07-ohms-law.html` (C07)
- `08-multimeter.html` (C08)

C09 to C11 (battery/bus, AC, faults) are later. Do not start them in an Ohm's Law pass unless Nick names them.
