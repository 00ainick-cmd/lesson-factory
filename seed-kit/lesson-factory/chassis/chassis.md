# Electric Ink lesson chassis (frozen)

This is the sequence engine for CAET days that ship inside AERO Player: Safety, HF, DC, AC, wire, databus, CNS, regs. The student must always know what to do next. A poke cannot be skipped. Chrome does not change per lesson.

Look: `ELECTRIC-INK-LOCK.md` plus `families.md` (DC quantity color, or Systems `--hero`). Voice: `nick-aet-voice`. **What the student does:** [beat-recipes.md](beat-recipes.md). Unique centerpiece is the recipe, not Resistance.

Do not write a new skill or a new skin to encode this. Clone the engine. Pick a recipe. Swap the blocks.

The sellable Human Factors catalog (hf1-m2 / `complacency.html`) is a different skin. CAET week 2 HF (LO 8.6) uses this chassis.

## Gold files

**Clone stencil** (generic spine, real gates):

`Training Projects/DC Fundamentals AI Rebuild/electric-ink-chassis/lesson-chassis.html`

**Recipes** (which poke for this day):

`Training Projects/DC Fundamentals AI Rebuild/electric-ink-chassis/beat-recipes.md`

**Live proof of a full DC lesson** (engine, not a stencil):

`AERO-Player/courses/caet-dc/lessons/01-resistance.html`

Author `Training Projects/DC Fundamentals AI Rebuild/01-resistance.html` has **no** gates. Do not copy it onto the player file.

Plans for the 45 days: `CAET 9 Week Program/CAET Daily Lesson Plans.html`.

## Frozen vs open

| Frozen | Open |
|---|---|
| `#ldock` identity, `__inkGate`, `.gatebar` / Continue | Beat count and labels |
| Dock ticks: green done, amber open, dark locked | Hover/focus popover copy (name + hint) |
| `#ldHint` always names the next action | Copy, figures, photos, CardCraft stages |
| `#check` state machine | ITEMS from the practice bank |
| Field-card shell (1 to 3 LO plates) | Plate count = this day's LOs |
| Player face (no reviewer HUD) | Title, goal, audio, `--qty` / `--hero` |
| Stay put: `ready()` does not scroll | |

A **block** is the teaching inside one beat. Improve the block. Do not wrap it in a new page chrome. Do not clone Ticket + Define + resistor flip into SDS, Dirty Dozen, or ARINC.

## Spine (not a DC 11-beat)

Every `[data-beat]` section is **read** or **lab**.

**Read:** Continue enabled on arrival. `data-clear` only.

**Lab:** Continue starts disabled (`data-need="1"`). `__inkGate.ready(id)` on the **first** real action. Then "Done. Continue." Extra reps do not gate. Do not scroll them to Continue.

Required: Start, one poke, Check, Field card. Optional: Why, a second poke. Drop anything that does not teach this day's goal.

## Gate markup

Read:

```html
<div class="gatebar">
  <p class="gatenote" id="gateNote-why">Read this, then Continue.</p>
  <button type="button" class="gate-next" data-clear="why">Continue</button>
</div>
```

Lab:

```html
<div class="gatebar">
  <p class="gatenote" id="gateNote-poke">[one concrete next action]</p>
  <button type="button" class="gate-next" data-clear="poke" data-need="1" disabled>Continue</button>
</div>
```

`data-clear` and `id="gateNote-{id}"` match the section `id`. Same id in `HINTS`. Bind ready listeners before any library early return.

## Ready

Fires on a real action, not on scroll. The recipe names the action (pick, one decode, flip, true meter path, 4 of 5). Do not auto-`clear` a lab. The student presses Continue.

`ready()` must not `scrollIntoView` the gatebar, a slider, or the next beat. They were still in that area of the page. Continue click may scroll to the next beat.

Check fail note names the score they need, then retry.

## Dock language

- **Done:** `--ok`. Clickable.
- **Open:** `--R` amber (or `--hero` in Systems). Slightly taller.
- **Locked:** `#2a303a`. Not clickable. Click flashes `#ldHint`.
- **Hover / focus (next lesson):** popover with beat name + hint. Locked: name only. Not a native `title`. Not a second HUD.

`#ldHint` always states the next action. When ready: green, "Done. Continue."

## Player chrome

The iframe is the lesson. `.app.face` hides the second HUD. HTML lessons `reports: true`. Completion on the field card. No Review Tracker. Tour skipped.

## How to change a block

1. Edit inside the section. Keep `id`, `data-beat`, gatebar, `ready()`.
2. If the poke changes, rewrite the hint in `#gateNote-{id}`, `HINTS[id]`, and the lede.
3. Drive it: locked Continue, do the poke, Continue enables.

## How to add a beat

Nick signs the beat map. New section, correct gate kind, `HINTS` line, `ready` if lab. Do not add a second dock.

## How later lessons steal

Steal: dock CSS, `__inkGate`, gatebar CSS, `#check` engine, family tokens.

Do not steal: Resistance lattice, color decoder, rho bench, Cirrus numbers, resistor photos, checkpoint stems, the stencil's example scenario.

Change: `data-course` / `data-num` / `data-title`, audio, `data-beat` labels, `HINTS`, recipe, ITEMS.

## Checklist

- [ ] Locked ticks are not a skip
- [ ] Lab Continue disabled until the poke
- [ ] `#ldHint` and `#gateNote-*` agree
- [ ] Recipe matches the day's goal (see beat-recipes.md)
- [ ] Field card plate count matches this day's LOs
- [ ] No em-dashes. Validate 0 FAIL
- [ ] Player copy is what students see
